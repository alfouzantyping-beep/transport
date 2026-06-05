"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

const tripSchema = z.object({
  tripDate: z.coerce.date(),
  customerId: z.string().min(1),
  driverId: z.string().min(1),
  vehicleId: z.string().min(1),
  fromCountry: z.string().min(2),
  toCountry: z.string().min(2),
  loadingPoint: z.string().min(2),
  deliveryPoint: z.string().min(2),
  doNumber: z.string().min(1),
  cargoType: z.string().min(2),
  cargoWeight: z.coerce.number().min(0),
  tripAmount: z.coerce.number().min(0),
  status: z.enum(["OPEN", "ON_TRIP", "COMPLETED", "CLOSED", "INVOICED", "CANCELLED"]),
  notes: z.string().optional(),
});

const cashSchema = z.object({
  tripId: z.string().min(1),
  amount: z.coerce.number().positive(),
  cashDate: z.coerce.date(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]),
  givenBy: z.string().min(2),
  notes: z.string().optional(),
});

const expenseSchema = z.object({
  tripId: z.string().min(1),
  expenseCategoryId: z.string().min(1),
  expenseDate: z.coerce.date(),
  receiptNo: z.string().optional(),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  receiptImageUrl: z.string().optional(),
});

const multiExpenseSchema = z.object({
  tripId: z.string().min(1),
  expenseDate: z.coerce.date(),
  receiptNo: z.string().optional(),
  description: z.string().optional(),
  receiptImageUrl: z.string().optional(),
});

const excelExpenseFields = [
  "qatarVisa",
  "qatarToll",
  "ksaVisa",
  "uaeCustoms",
  "ksaCustoms",
  "mezan",
  "jordanBorder",
  "cameraFine",
  "hayaPeshgi",
  "toll",
  "gatePass",
  "diesel",
  "food",
  "border",
  "maintenance",
] as const;

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

async function nextTripNo(date = new Date()) {
  const year = date.getFullYear();
  const count = await prisma.trip.count({
    where: {
      OR: [
        { tripNo: { startsWith: `TRIP-${year}-` } },
        { tripNumber: { startsWith: `TRIP-${year}-` } },
      ],
    },
  });
  return `TRIP-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function truckForVehicle(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  const existing = await prisma.truck.findFirst({ where: { truckNumber: vehicle.truckNo } });
  if (existing) return existing;
  return prisma.truck.create({
    data: {
      truckNumber: vehicle.truckNo,
      plateNumber: vehicle.plateNo,
      trailerNumber: vehicle.trailerNo || "",
      type: vehicle.vehicleType,
      registrationExpiry: vehicle.registrationExpiry,
      insuranceExpiry: vehicle.insuranceExpiry,
      assignedDriverId: vehicle.currentDriverId,
      status: vehicle.status === "ON_TRIP" ? "IN_TRIP" : vehicle.status,
    },
  });
}

export async function createTrip(formData: FormData) {
  await requireSession();
  const data = tripSchema.parse(values(formData));
  const truck = await truckForVehicle(data.vehicleId);
  const tripNo = await nextTripNo(data.tripDate);
  await prisma.trip.create({
    data: {
      ...data,
      tripNo,
      tripNumber: tripNo,
      truckId: truck.id,
      createdAt: data.tripDate,
      updatedAt: data.tripDate,
    },
  });
  if (data.status === "ON_TRIP") {
    await prisma.vehicle.update({ where: { id: data.vehicleId }, data: { status: "ON_TRIP", currentDriverId: data.driverId } });
  }
  revalidatePath("/trips");
  redirect("/trips");
}

export async function updateTrip(id: string, formData: FormData) {
  await requireSession();
  const data = tripSchema.parse(values(formData));
  const truck = await truckForVehicle(data.vehicleId);
  await prisma.trip.update({ where: { id }, data: { ...data, truckId: truck.id } });
  revalidatePath("/trips");
  redirect(`/trips/${id}`);
}

export async function createCashAdvance(formData: FormData) {
  await requireSession();
  const data = cashSchema.parse(values(formData));
  const trip = await prisma.trip.findUniqueOrThrow({ where: { id: data.tripId }, select: { driverId: true } });
  await prisma.driverCashAdvance.create({ data: { ...data, driverId: trip.driverId } });
  revalidatePath("/driver-cash");
  revalidatePath(`/trips/${data.tripId}`);
  redirect("/driver-cash");
}

export async function createTripExpense(formData: FormData) {
  await requireSession();
  const data = multiExpenseSchema.parse(values(formData));
  const trip = await prisma.trip.findUniqueOrThrow({ where: { id: data.tripId }, select: { driverId: true, vehicleId: true } });
  const expenseAmounts = Object.fromEntries(
    excelExpenseFields.map((field) => [field, Number(formData.get(field) || 0)])
  ) as Record<(typeof excelExpenseFields)[number], number>;
  const usedPettyCash = Object.values(expenseAmounts).reduce((sum, amount) => sum + amount, 0);
  const pettyCash = Number(formData.get("pettyCash") || 0);
  const remainingBalance = pettyCash - usedPettyCash;

  if (usedPettyCash <= 0) {
    redirect(`/trip-expenses/create?error=${encodeURIComponent("Enter at least one Excel column amount greater than zero.")}`);
  }

  await prisma.tripExpense.create({
    data: {
      ...data,
      ...expenseAmounts,
      driverId: trip.driverId,
      vehicleId: trip.vehicleId,
      expenseCategoryId: null,
      amount: usedPettyCash,
      pettyCash,
      usedPettyCash,
      remainingBalance,
      notes: data.description,
    },
  });
  revalidatePath("/trip-expenses");
  revalidatePath(`/trips/${data.tripId}`);
  redirect("/trip-expenses");
}

export async function updateTripExpense(id: string, formData: FormData) {
  await requireSession();
  const data = multiExpenseSchema.parse(values(formData));
  const trip = await prisma.trip.findUniqueOrThrow({ where: { id: data.tripId }, select: { driverId: true, vehicleId: true } });
  const expenseAmounts = Object.fromEntries(
    excelExpenseFields.map((field) => [field, Number(formData.get(field) || 0)])
  ) as Record<(typeof excelExpenseFields)[number], number>;
  const usedPettyCash = Object.values(expenseAmounts).reduce((sum, amount) => sum + amount, 0);
  const pettyCash = Number(formData.get("pettyCash") || 0);
  await prisma.tripExpense.update({
    where: { id },
    data: {
      ...data,
      ...expenseAmounts,
      driverId: trip.driverId,
      vehicleId: trip.vehicleId,
      expenseCategoryId: null,
      amount: usedPettyCash,
      pettyCash,
      usedPettyCash,
      remainingBalance: pettyCash - usedPettyCash,
      notes: data.description,
    },
  });
  revalidatePath("/trip-expenses");
  redirect("/trip-expenses");
}

export async function upsertSettlement(tripId: string, markSettled = false, notes?: string) {
  await requireSession();
  const trip = await prisma.trip.findUniqueOrThrow({ where: { id: tripId }, select: { driverId: true } });
  const [cash, expenses] = await Promise.all([
    prisma.driverCashAdvance.aggregate({ where: { tripId }, _sum: { amount: true } }),
    prisma.tripExpense.aggregate({ where: { tripId }, _sum: { amount: true } }),
  ]);
  const totalCashGiven = Number(cash._sum.amount || 0);
  const totalExpenses = Number(expenses._sum.amount || 0);
  const settlementBalance = totalCashGiven - totalExpenses;
  const resultType =
    settlementBalance > 0 ? "DRIVER_OWES_COMPANY" : settlementBalance < 0 ? "COMPANY_OWES_DRIVER" : "SETTLED";
  const status = markSettled ? "SETTLED" : "PENDING";

  await prisma.tripSettlement.upsert({
    where: { tripId },
    update: {
      totalCashGiven,
      totalExpenses,
      settlementBalance,
      resultType,
      status,
      settlementDate: markSettled ? new Date() : null,
      notes,
    },
    create: {
      tripId,
      driverId: trip.driverId,
      totalCashGiven,
      totalExpenses,
      settlementBalance,
      resultType,
      status,
      settlementDate: markSettled ? new Date() : null,
      notes,
    },
  });
  if (markSettled) {
    await prisma.trip.update({ where: { id: tripId }, data: { status: "CLOSED" } });
  }
  revalidatePath("/trip-settlements");
  revalidatePath(`/trip-settlements/${tripId}`);
  revalidatePath(`/trips/${tripId}`);
}

export async function calculateSettlement(formData: FormData) {
  const tripId = String(formData.get("tripId") || "");
  await upsertSettlement(tripId, false, String(formData.get("notes") || ""));
  redirect(`/trip-settlements/${tripId}`);
}

export async function markSettlementSettled(formData: FormData) {
  const tripId = String(formData.get("tripId") || "");
  await upsertSettlement(tripId, true, String(formData.get("notes") || ""));
  redirect(`/trip-settlements/${tripId}`);
}

function legacyExpenseColumn(categoryName: string) {
  const key = categoryName.trim().toLowerCase();
  const map: Record<string, string> = {
    diesel: "diesel",
    petrol: "petrol",
    toll: "toll",
    "border charges": "border",
    visa: "visa",
    customs: "customs",
    food: "food",
    parking: "parking",
    hotel: "hotel",
    maintenance: "maintenance",
    "gate pass": "gatePass",
    other: "other",
  };
  return map[key];
}
