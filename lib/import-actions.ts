"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { expenseColumns, importConfigs } from "@/lib/import-config";
import type { ImportType } from "@/app/generated/prisma/client";

type ExcelRow = Record<string, unknown>;
type Mapping = Record<string, string>;

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function value(row: ExcelRow, mapping: Mapping, field: string) {
  const column = mapping[field];
  return column ? row[column] : undefined;
}

function text(row: ExcelRow, mapping: Mapping, field: string) {
  return String(value(row, mapping, field) ?? "").trim();
}

function numberValue(row: ExcelRow, mapping: Mapping, field: string) {
  const raw = value(row, mapping, field);
  if (raw === null || raw === undefined || raw === "") return 0;
  const parsed = Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseExcelDate(raw: unknown) {
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + raw * 86400000);
  }
  const parsed = new Date(String(raw ?? ""));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function nextTripNumber(index: number, date: Date) {
  return `IMP-${date.getFullYear()}-${Date.now()}-${String(index).padStart(4, "0")}`;
}

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

async function loadLookups() {
  const [drivers, vehicles, trucks, customers, trips] = await Promise.all([
    prisma.driver.findMany(),
    prisma.vehicle.findMany(),
    prisma.truck.findMany(),
    prisma.customer.findMany(),
    prisma.trip.findMany(),
  ]);

  return {
    drivers,
    vehicles,
    trucks,
    customers,
    trips,
    driverByName: new Map(drivers.map((driver) => [normalize(driver.name), driver])),
    vehicleByTruck: new Map(vehicles.map((vehicle) => [normalize(vehicle.truckNo), vehicle])),
    truckByNumber: new Map(trucks.map((truck) => [normalize(truck.truckNumber), truck])),
    customerByName: new Map(
      customers.flatMap((customer) => [
        [normalize(customer.companyName), customer] as const,
        [normalize(customer.name), customer] as const,
      ])
    ),
  };
}

function findTrip(lookups: Awaited<ReturnType<typeof loadLookups>>, tripRef: string, truckText: string) {
  const ref = normalize(tripRef);
  const truck = normalize(truckText);
  return lookups.trips.find((trip) => {
    const matchesRef =
      normalize(trip.tripNo) === ref ||
      normalize(trip.tripNumber) === ref ||
      normalize(trip.doNumber) === ref;
    if (!matchesRef) return false;
    if (!truck) return true;
    return trip.truckId === lookups.truckByNumber.get(truck)?.id || trip.vehicleId === lookups.vehicleByTruck.get(truck)?.id;
  });
}

async function ensureCategory(name: string) {
  return prisma.expenseCategory.upsert({
    where: { name },
    update: {},
    create: { name, type: "TRIP", status: "ACTIVE" },
  });
}

async function importTripRow(row: ExcelRow, mapping: Mapping, index: number, lookups: Awaited<ReturnType<typeof loadLookups>>) {
  const errors: string[] = [];
  const tripDate = parseExcelDate(value(row, mapping, "tripDate"));
  const driver = lookups.driverByName.get(normalize(text(row, mapping, "driver")));
  const vehicle = lookups.vehicleByTruck.get(normalize(text(row, mapping, "truck")));
  const customer = lookups.customerByName.get(normalize(text(row, mapping, "customer")));
  const truck = vehicle ? lookups.truckByNumber.get(normalize(vehicle.truckNo)) : undefined;
  const amount = numberValue(row, mapping, "tripAmount");

  if (!tripDate) errors.push("Date is required or invalid.");
  if (!driver) errors.push(`Driver not found: ${text(row, mapping, "driver")}`);
  if (!vehicle) errors.push(`Truck/vehicle not found: ${text(row, mapping, "truck")}`);
  if (!truck) errors.push(`Matching fleet truck not found for vehicle: ${text(row, mapping, "truck")}`);
  if (!customer) errors.push(`Customer not found: ${text(row, mapping, "customer")}`);
  if (!text(row, mapping, "doNumber")) errors.push("DO No is required.");
  if (!Number.isFinite(amount) || amount <= 0) errors.push("Trip Amount must be greater than zero.");
  if (errors.length) return errors;

  const tripNo = nextTripNumber(index, tripDate!);
  await prisma.trip.create({
    data: {
      tripNo,
      tripNumber: tripNo,
      tripDate: tripDate!,
      customerId: customer!.id,
      driverId: driver!.id,
      truckId: truck!.id,
      vehicleId: vehicle!.id,
      fromCountry: text(row, mapping, "loadingPoint") || "Imported",
      toCountry: text(row, mapping, "deliveryPoint") || "Imported",
      loadingPoint: text(row, mapping, "loadingPoint"),
      deliveryPoint: text(row, mapping, "deliveryPoint"),
      doNumber: text(row, mapping, "doNumber"),
      cargoType: "Imported",
      cargoWeight: 0,
      tripAmount: amount,
      status: "OPEN",
      notes: "Imported from old Excel records",
    },
  });
  return [];
}

async function importDriverCashRow(row: ExcelRow, mapping: Mapping, lookups: Awaited<ReturnType<typeof loadLookups>>) {
  const errors: string[] = [];
  const cashDate = parseExcelDate(value(row, mapping, "cashDate"));
  const driver = lookups.driverByName.get(normalize(text(row, mapping, "driver")));
  const trip = findTrip(lookups, text(row, mapping, "tripRef"), text(row, mapping, "truck"));
  const amount = numberValue(row, mapping, "pettyCash");

  if (!cashDate) errors.push("Date is required or invalid.");
  if (!driver) errors.push(`Driver not found: ${text(row, mapping, "driver")}`);
  if (!trip) errors.push(`Trip/DO No not found: ${text(row, mapping, "tripRef")}`);
  if (!Number.isFinite(amount) || amount <= 0) errors.push("Petty Cash must be greater than zero.");
  if (trip && driver && trip.driverId !== driver.id) errors.push("Trip belongs to a different driver.");
  if (errors.length) return errors;

  await prisma.driverCashAdvance.create({
    data: {
      tripId: trip!.id,
      driverId: driver!.id,
      amount,
      cashDate: cashDate!,
      paymentMethod: "CASH",
      givenBy: "Imported",
      notes: `Imported petty cash. Used: ${numberValue(row, mapping, "usedPettyCash") || 0}, Remaining: ${numberValue(row, mapping, "remainingBalance") || 0}`,
    },
  });
  return [];
}

async function importTripExpensesRow(row: ExcelRow, mapping: Mapping, lookups: Awaited<ReturnType<typeof loadLookups>>) {
  const errors: string[] = [];
  const expenseDate = parseExcelDate(value(row, mapping, "expenseDate"));
  const driver = lookups.driverByName.get(normalize(text(row, mapping, "driver")));
  const trip = findTrip(lookups, text(row, mapping, "tripRef"), text(row, mapping, "truck"));
  const entries = expenseColumns
    .map(([column, category]) => ({ column, category, amount: numberValue(row, mapping, column) }))
    .filter((entry) => Number.isFinite(entry.amount) && entry.amount > 0);

  if (!expenseDate) errors.push("Date is required or invalid.");
  if (!driver) errors.push(`Driver not found: ${text(row, mapping, "driver")}`);
  if (!trip) errors.push(`Trip/DO No not found: ${text(row, mapping, "tripRef")}`);
  if (!entries.length) errors.push("At least one expense amount column is required.");
  if (trip && driver && trip.driverId !== driver.id) errors.push("Trip belongs to a different driver.");
  if (errors.length) return errors;

  for (const entry of entries) {
    const category = await ensureCategory(entry.category);
    await prisma.tripExpense.create({
      data: {
        tripId: trip!.id,
        driverId: driver!.id,
        vehicleId: trip!.vehicleId,
        expenseCategoryId: category.id,
        expenseDate: expenseDate!,
        receiptNo: `Imported ${entry.column}`,
        amount: entry.amount,
        usedPettyCash: entry.amount,
        description: `Imported ${entry.category}`,
        notes: "Imported from petty cash Excel",
      },
    });
  }
  return [];
}

async function importSalaryRow(row: ExcelRow, mapping: Mapping, lookups: Awaited<ReturnType<typeof loadLookups>>) {
  const errors: string[] = [];
  const driver = lookups.driverByName.get(normalize(text(row, mapping, "driver")));
  const salaryMonth = text(row, mapping, "salaryMonth");
  const basicSalary = numberValue(row, mapping, "basicSalary");
  const roomRentDeduction = numberValue(row, mapping, "roomRentDeduction");
  const advanceDeduction = numberValue(row, mapping, "advanceDeduction");
  const trafficFineDeduction = numberValue(row, mapping, "trafficFineDeduction");
  const visaDeduction = numberValue(row, mapping, "visaDeduction");
  const otherDeduction = numberValue(row, mapping, "otherDeduction");
  const finalSalary = numberValue(row, mapping, "netSalary");

  if (!driver) errors.push(`Driver not found: ${text(row, mapping, "driver")}`);
  if (!salaryMonth) errors.push("Month is required.");
  if (!Number.isFinite(basicSalary) || basicSalary <= 0) errors.push("Basic Salary must be greater than zero.");
  if (errors.length) return errors;

  const totalDeduction = roomRentDeduction + advanceDeduction + trafficFineDeduction + visaDeduction + otherDeduction;
  const netSalary = Number.isFinite(finalSalary) && finalSalary > 0 ? finalSalary : basicSalary - totalDeduction;
  const statusText = normalize(text(row, mapping, "status"));
  const status = statusText.includes("paid") ? "PAID" : "PENDING";
  const paidAmount = status === "PAID" ? netSalary : 0;

  await prisma.driverMonthlySalary.create({
    data: {
      driverId: driver!.id,
      salaryMonth,
      basicSalary,
      roomRentDeduction,
      advanceDeduction,
      trafficFineDeduction,
      visaDeduction,
      otherDeduction,
      totalDeduction,
      netSalary,
      paidAmount,
      balance: netSalary - paidAmount,
      status,
      notes: "Imported from old Excel records",
    },
  });
  return [];
}

async function importMaintenanceRow(row: ExcelRow, mapping: Mapping, lookups: Awaited<ReturnType<typeof loadLookups>>) {
  const errors: string[] = [];
  const maintenanceDate = parseExcelDate(value(row, mapping, "maintenanceDate"));
  const vehicle = lookups.vehicleByTruck.get(normalize(text(row, mapping, "truck")));
  const amount = numberValue(row, mapping, "amount");

  if (!maintenanceDate) errors.push("Date is required or invalid.");
  if (!vehicle) errors.push(`Truck/vehicle not found: ${text(row, mapping, "truck")}`);
  if (!text(row, mapping, "maintenanceType")) errors.push("Maintenance Type is required.");
  if (!text(row, mapping, "workshop")) errors.push("Workshop is required.");
  if (!Number.isFinite(amount) || amount <= 0) errors.push("Amount must be greater than zero.");
  if (errors.length) return errors;

  await prisma.vehicleMaintenance.create({
    data: {
      vehicleId: vehicle!.id,
      maintenanceDate: maintenanceDate!,
      maintenanceType: text(row, mapping, "maintenanceType"),
      workshopName: text(row, mapping, "workshop"),
      amount,
      description: text(row, mapping, "notes") || "Imported from old Excel records",
      status: "COMPLETED",
    },
  });
  return [];
}

async function importCustomerBalanceRow(row: ExcelRow, mapping: Mapping, lookups: Awaited<ReturnType<typeof loadLookups>>) {
  const errors: string[] = [];
  const customer = lookups.customerByName.get(normalize(text(row, mapping, "customer")));
  const totalAmount = numberValue(row, mapping, "totalAmount");
  const receivedAmount = numberValue(row, mapping, "receivedAmount");
  const pendingRaw = numberValue(row, mapping, "pendingAmount");
  const pendingAmount = Number.isFinite(pendingRaw) && pendingRaw > 0 ? pendingRaw : Math.max(0, totalAmount - receivedAmount);

  if (!customer) errors.push(`Customer not found: ${text(row, mapping, "customer")}`);
  if (!Number.isFinite(totalAmount) || totalAmount < 0) errors.push("Total Invoice must be a valid amount.");
  if (errors.length) return errors;

  await prisma.customerOpeningBalance.create({
    data: {
      customerId: customer!.id,
      openingDate: new Date(),
      totalAmount,
      receivedAmount: Number.isFinite(receivedAmount) ? receivedAmount : 0,
      pendingAmount,
      notes: "Imported opening balance from old Excel records",
    },
  });
  return [];
}

async function processRow(
  importKey: string,
  row: ExcelRow,
  mapping: Mapping,
  index: number,
  lookups: Awaited<ReturnType<typeof loadLookups>>
) {
  if (importKey === "trips") return importTripRow(row, mapping, index, lookups);
  if (importKey === "driver-cash") return importDriverCashRow(row, mapping, lookups);
  if (importKey === "trip-expenses") return importTripExpensesRow(row, mapping, lookups);
  if (importKey === "salaries") return importSalaryRow(row, mapping, lookups);
  if (importKey === "maintenance") return importMaintenanceRow(row, mapping, lookups);
  if (importKey === "customer-balances") return importCustomerBalanceRow(row, mapping, lookups);
  return ["Unknown import type."];
}

export async function runExcelImport(formData: FormData) {
  const session = await requireSession();
  const importKey = String(formData.get("importKey") || "");
  const config = importConfigs[importKey];
  const fileName = String(formData.get("fileName") || "uploaded.xlsx");
  const rows = JSON.parse(String(formData.get("rows") || "[]")) as ExcelRow[];
  const mapping = JSON.parse(String(formData.get("mapping") || "{}")) as Mapping;

  if (!config) throw new Error("Invalid import type.");

  const log = await prisma.importLog.create({
    data: {
      importType: config.type as ImportType,
      fileName,
      totalRows: rows.length,
      status: "PENDING",
      uploadedById: session.userId,
    },
  });

  const lookups = await loadLookups();
  let successRows = 0;
  const rowErrors: { rowNumber: number; errorMessage: string; rawData: string }[] = [];

  for (let index = 0; index < rows.length; index++) {
    const errors = await processRow(importKey, rows[index], mapping, index + 2, lookups);
    if (errors.length) {
      rowErrors.push({
        rowNumber: index + 2,
        errorMessage: errors.join(" "),
        rawData: JSON.stringify(rows[index]),
      });
    } else {
      successRows += 1;
    }
  }

  if (rowErrors.length) {
    await prisma.importRowError.createMany({
      data: rowErrors.map((error) => ({ ...error, importLogId: log.id })),
    });
  }

  await prisma.importLog.update({
    where: { id: log.id },
    data: {
      successRows,
      failedRows: rowErrors.length,
      status: successRows > 0 ? "IMPORTED" : "FAILED",
    },
  });

  revalidatePath("/import/logs");
  revalidatePath(config.path);
  redirect(`/import/logs?logId=${log.id}`);
}
