import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tripId } = await props.params;
    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const {
      pettyCash, // The updated Petty Cash Issued amount
      diesel,
      food,
      border,
      maintenance,
      toll,
      qatarVisa,
      qatarToll,
      ksaVisa,
      uaeCustoms,
      ksaCustoms,
      mezan,
      jordanBorder,
      cameraFine,
      hayaPeshgi,
      gatePass,
      notes,
    } = body;

    // Validate that trip exists
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driverCash: true,
        expenses: true,
        closing: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const driverId = trip.driverId;

    // Parse values to floats
    const newCashAmount = parseFloat(pettyCash || "0");
    const parsedExpenses = {
      diesel: parseFloat(diesel || "0"),
      food: parseFloat(food || "0"),
      border: parseFloat(border || "0"),
      maintenance: parseFloat(maintenance || "0"),
      toll: parseFloat(toll || "0"),
      qatarVisa: parseFloat(qatarVisa || "0"),
      qatarToll: parseFloat(qatarToll || "0"),
      ksaVisa: parseFloat(ksaVisa || "0"),
      uaeCustoms: parseFloat(uaeCustoms || "0"),
      ksaCustoms: parseFloat(ksaCustoms || "0"),
      mezan: parseFloat(mezan || "0"),
      jordanBorder: parseFloat(jordanBorder || "0"),
      cameraFine: parseFloat(cameraFine || "0"),
      hayaPeshgi: parseFloat(hayaPeshgi || "0"),
      gatePass: parseFloat(gatePass || "0"),
    };

    // Calculate total for these edited expenses
    const newExpensesTotal = Object.values(parsedExpenses).reduce((sum, val) => sum + val, 0);

    // Perform database operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Manage DriverCash
      const existingCash = trip.driverCash[0]; // Get the first cash record (Excel style is 1 row)
      let oldCashAmount = 0;

      if (existingCash) {
        oldCashAmount = Number(existingCash.amount);
        await tx.driverCash.update({
          where: { id: existingCash.id },
          data: {
            amount: newCashAmount,
            notes: notes || existingCash.notes || "Updated via Ledger",
          },
        });
      } else if (newCashAmount > 0) {
        await tx.driverCash.create({
          data: {
            tripId,
            amount: newCashAmount,
            date: new Date(),
            paymentMethod: "CASH",
            notes: notes || "Initial cash issued (Ledger)",
          },
        });
      }

      // 2. Manage TripExpense
      const existingExpense = trip.expenses[0];
      if (existingExpense) {
        await tx.tripExpense.update({
          where: { id: existingExpense.id },
          data: {
            ...parsedExpenses,
            notes: notes || existingExpense.notes || "Updated via Ledger",
          },
        });
      } else {
        await tx.tripExpense.create({
          data: {
            tripId,
            ...parsedExpenses,
            notes: notes || "Logged via Ledger",
          },
        });
      }

      // 3. Update driver outstanding advanceBalance in their profile
      const cashDiff = newCashAmount - oldCashAmount;
      if (trip.closing) {
        // If trip is already closed, the closing record was decrementing oldCashAmount from advanceBalance.
        // We now need to decrement newCashAmount instead. So we adjust driver advanceBalance by -cashDiff.
        await tx.driver.update({
          where: { id: driverId },
          data: {
            advanceBalance: { decrement: cashDiff },
          },
        });

        // Also recalculate and update the TripClosing record
        const balance = newCashAmount - newExpensesTotal;
        const remainingBalance = balance > 0 ? balance : 0;
        const extraPayable = balance < 0 ? Math.abs(balance) : 0;

        await tx.tripClosing.update({
          where: { id: trip.closing.id },
          data: {
            totalCashGiven: newCashAmount,
            totalExpenses: newExpensesTotal,
            remainingBalance,
            extraPayable,
          },
        });
      } else {
        // If trip is NOT closed, the advance balance tracks cash issued.
        // So we increase the driver's advanceBalance by the cashDiff.
        await tx.driver.update({
          where: { id: driverId },
          data: {
            advanceBalance: { increment: cashDiff },
          },
        });
      }

      return { success: true };
    });

    return NextResponse.json({ success: true, message: "Ledger entry updated successfully" });
  } catch (error) {
    console.error("Ledger update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
