"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

const statusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const customerSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(3, "Address is required"),
  trn: z.string().min(3, "TRN is required"),
  paymentTerms: z.string().min(2, "Payment terms are required"),
  creditLimit: z.coerce.number().min(0, "Credit limit cannot be negative"),
  status: statusSchema,
});

const driverSchema = z.object({
  name: z.string().min(2, "Driver name is required"),
  mobile: z.string().min(5, "Mobile is required"),
  passportNo: z.string().min(3, "Passport number is required"),
  emiratesId: z.string().min(3, "Emirates ID is required"),
  licenseNo: z.string().min(3, "License number is required"),
  licenseExpiry: z.coerce.date(),
  visaExpiry: z.coerce.date(),
  basicSalary: z.coerce.number().min(0, "Salary cannot be negative"),
  advanceBalance: z.coerce.number().min(0),
  visaBalance: z.coerce.number().min(0),
  status: statusSchema,
});

const vehicleSchema = z.object({
  truckNo: z.string().min(2, "Truck number is required"),
  plateNo: z.string().min(2, "Plate number is required"),
  trailerNo: z.string().optional(),
  vehicleType: z.enum(["TRUCK", "TRAILER", "TANKER", "FLATBED", "REEFER", "WATER_TANKER", "OTHER"]),
  model: z.string().optional(),
  ownerType: z.enum(["COMPANY_OWNED", "RENTED", "THIRD_PARTY"]),
  registrationExpiry: z.coerce.date(),
  insuranceExpiry: z.coerce.date(),
  currentDriverId: z.string().optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "MAINTENANCE", "INACTIVE"]),
});

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Category name is required"),
  type: z.enum(["TRIP", "VEHICLE", "DRIVER", "GENERAL"]),
  description: z.string().optional(),
  status: statusSchema,
});

const companySchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  tradeLicenseNo: z.string().min(2, "Trade license is required"),
  trn: z.string().min(2, "TRN is required"),
  address: z.string().min(3, "Address is required"),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email("Valid email is required"),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  accountNo: z.string().optional(),
});

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function saveCompany(formData: FormData) {
  await requireSession();
  const data = companySchema.parse(values(formData));
  const existing = await prisma.company.findFirst();
  if (existing) {
    await prisma.company.update({ where: { id: existing.id }, data });
  } else {
    await prisma.company.create({ data });
  }
  revalidatePath("/settings/company");
  redirect("/settings/company");
}

export async function createCustomer(formData: FormData) {
  await requireSession();
  const data = customerSchema.parse(values(formData));
  await prisma.customer.create({ data: { ...data, name: data.companyName } });
  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(id: string, formData: FormData) {
  await requireSession();
  const data = customerSchema.parse(values(formData));
  await prisma.customer.update({ where: { id }, data: { ...data, name: data.companyName } });
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

export async function createDriver(formData: FormData) {
  await requireSession();
  const data = driverSchema.parse(values(formData));
  await prisma.driver.create({
    data: {
      ...data,
      passport: data.passportNo,
      license: data.licenseNo,
      salary: data.basicSalary,
    },
  });
  revalidatePath("/drivers");
  redirect("/drivers");
}

export async function updateDriver(id: string, formData: FormData) {
  await requireSession();
  const data = driverSchema.parse(values(formData));
  await prisma.driver.update({
    where: { id },
    data: {
      ...data,
      passport: data.passportNo,
      license: data.licenseNo,
      salary: data.basicSalary,
    },
  });
  revalidatePath("/drivers");
  redirect(`/drivers/${id}`);
}

export async function createVehicle(formData: FormData) {
  await requireSession();
  const data = vehicleSchema.parse(values(formData));
  data.truckNo = data.truckNo.trim();
  data.plateNo = data.plateNo.trim();

  const duplicate = await prisma.vehicle.findFirst({
    where: {
      OR: [{ truckNo: data.truckNo }, { plateNo: data.plateNo }],
    },
    select: { truckNo: true, plateNo: true },
  });

  if (duplicate) {
    const field = duplicate.truckNo === data.truckNo ? "truck number" : "plate number";
    redirect(`/vehicles/create?error=${encodeURIComponent(`This ${field} already exists. Please use a different value or edit the existing vehicle.`)}`);
  }

  await prisma.vehicle.create({
    data: { ...data, currentDriverId: data.currentDriverId || null },
  });
  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function updateVehicle(id: string, formData: FormData) {
  await requireSession();
  const data = vehicleSchema.parse(values(formData));
  data.truckNo = data.truckNo.trim();
  data.plateNo = data.plateNo.trim();

  const duplicate = await prisma.vehicle.findFirst({
    where: {
      id: { not: id },
      OR: [{ truckNo: data.truckNo }, { plateNo: data.plateNo }],
    },
    select: { truckNo: true, plateNo: true },
  });

  if (duplicate) {
    const field = duplicate.truckNo === data.truckNo ? "truck number" : "plate number";
    redirect(`/vehicles/${id}/edit?error=${encodeURIComponent(`This ${field} already exists. Please use a different value.`)}`);
  }

  await prisma.vehicle.update({
    where: { id },
    data: { ...data, currentDriverId: data.currentDriverId || null },
  });
  revalidatePath("/vehicles");
  redirect(`/vehicles/${id}`);
}

export async function saveExpenseCategory(formData: FormData) {
  await requireSession();
  const data = categorySchema.parse(values(formData));
  if (data.id) {
    await prisma.expenseCategory.update({ where: { id: data.id }, data });
  } else {
    await prisma.expenseCategory.create({ data });
  }
  revalidatePath("/expense-categories");
  redirect("/expense-categories");
}

export async function seedPhaseOneTwo() {
  const roles = [
    { name: "Admin", description: "Full system access" },
    { name: "Accountant", description: "Finance and reporting access" },
    { name: "Operations", description: "Daily transport operations access" },
  ];
  for (const role of roles) {
    await prisma.role.upsert({ where: { name: role.name }, update: role, create: role });
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Admin" } });
  const passwordHash = await hashPassword("admin123456");
  await prisma.user.upsert({
    where: { email: "admin@transport.com" },
    update: { name: "Admin", passwordHash, password: passwordHash, roleId: adminRole.id, role: "Admin", status: "ACTIVE" },
    create: {
      name: "Admin",
      username: "admin",
      email: "admin@transport.com",
      passwordHash,
      password: passwordHash,
      roleId: adminRole.id,
      role: "Admin",
      status: "ACTIVE",
    },
  });
}
