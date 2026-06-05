"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

async function settleTrip(tripId: string, notes: string) {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    select: { driverId: true },
  });
  const [cash, expenses] = await Promise.all([
    prisma.driverCashAdvance.aggregate({ where: { tripId }, _sum: { amount: true } }),
    prisma.tripExpense.aggregate({ where: { tripId }, _sum: { amount: true } }),
  ]);
  const totalCashGiven = Number(cash._sum.amount || 0);
  const totalExpenses = Number(expenses._sum.amount || 0);
  const settlementBalance = totalCashGiven - totalExpenses;
  const resultType =
    settlementBalance > 0
      ? "DRIVER_OWES_COMPANY"
      : settlementBalance < 0
        ? "COMPANY_OWES_DRIVER"
        : "SETTLED";

  await prisma.$transaction([
    prisma.tripSettlement.upsert({
      where: { tripId },
      update: {
        totalCashGiven,
        totalExpenses,
        settlementBalance,
        resultType,
        status: "SETTLED",
        settlementDate: new Date(),
        notes,
      },
      create: {
        tripId,
        driverId: trip.driverId,
        totalCashGiven,
        totalExpenses,
        settlementBalance,
        resultType,
        status: "SETTLED",
        settlementDate: new Date(),
        notes,
      },
    }),
    prisma.trip.update({
      where: { id: tripId },
      data: { status: "CLOSED" },
    }),
  ]);

  return trip.driverId;
}

export async function settleDriverTrip(formData: FormData) {
  await requireSession();
  const tripId = String(formData.get("tripId") || "");
  const driverId = await settleTrip(tripId, String(formData.get("notes") || "Settled from driver ledger"));

  revalidatePath("/driver-ledger");
  revalidatePath(`/driver-ledger/${driverId}`);
  revalidatePath("/trip-settlements");
  redirect(`/driver-ledger/${driverId}`);
}

export async function settleAllDriverTrips(formData: FormData) {
  await requireSession();
  const driverId = String(formData.get("driverId") || "");
  const trips = await prisma.trip.findMany({
    where: { driverId },
    include: { settlement: true },
    orderBy: { tripDate: "desc" },
  });

  for (const trip of trips) {
    if (trip.settlement?.status !== "SETTLED") {
      await settleTrip(trip.id, String(formData.get("notes") || "Bulk settled from driver ledger"));
    }
  }

  revalidatePath("/driver-ledger");
  revalidatePath(`/driver-ledger/${driverId}`);
  revalidatePath("/trip-settlements");
  redirect(`/driver-ledger/${driverId}`);
}

export async function markSalaryPaid(formData: FormData) {
  await requireSession();
  const salaryId = String(formData.get("salaryId") || "");
  const driverId = String(formData.get("driverId") || "");
  const salary = await prisma.driverMonthlySalary.findUniqueOrThrow({ where: { id: salaryId } });

  await prisma.driverMonthlySalary.update({
    where: { id: salaryId },
    data: {
      paidAmount: salary.netSalary,
      balance: 0,
      status: "PAID",
      notes: salary.notes || "Marked paid from driver ledger",
    },
  });

  revalidatePath(`/driver-ledger/${driverId}`);
  revalidatePath(`/drivers/${driverId}`);
  revalidatePath("/salaries");
  redirect(`/driver-ledger/${driverId}`);
}
