import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

let mockTripClosings = [
  {
    id: "close-1",
    tripId: "trip-3",
    tripNumber: "TRIP-2026-003",
    totalCashGiven: 2000.00,
    totalExpenses: 1850.00,
    remainingBalance: 150.00,
    extraPayable: 0.00,
    closedDate: "2026-05-30T10:00:00.000Z",
  }
];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    try {
      const closings = await prisma.tripClosing.findMany({
        where: tripId ? { tripId } : {},
        orderBy: { closedDate: "desc" },
        include: {
          trip: { select: { tripNumber: true } }
        }
      });

      const formatted = closings.map(c => ({
        ...c,
        totalCashGiven: Number(c.totalCashGiven),
        totalExpenses: Number(c.totalExpenses),
        remainingBalance: Number(c.remainingBalance),
        extraPayable: Number(c.extraPayable),
        tripNumber: c.trip?.tripNumber || "Unknown"
      }));

      return NextResponse.json({ live: true, data: formatted });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock closings.");
      const filteredMock = tripId ? mockTripClosings.filter(c => c.tripId === tripId) : mockTripClosings;
      return NextResponse.json({ live: false, data: filteredMock });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tripId } = body;

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    try {
      // 1. Fetch all driver cash given for this trip
      const cashLogs = await prisma.driverCash.findMany({ where: { tripId } });
      const totalCashGiven = cashLogs.reduce((sum, c) => sum + Number(c.amount), 0);

      // 2. Fetch all expenses for this trip
      const expenseLogs = await prisma.tripExpense.findMany({ where: { tripId } });
      const totalExpenses = expenseLogs.reduce((sum, e) => {
        return sum + 
          Number(e.diesel) +
          Number(e.petrol) +
          Number(e.toll) +
          Number(e.border) +
          Number(e.visa) +
          Number(e.customs) +
          Number(e.food) +
          Number(e.parking) +
          Number(e.maintenance) +
          Number(e.hotel) +
          Number(e.other);
      }, 0);

      const balance = totalCashGiven - totalExpenses;
      const remainingBalance = balance > 0 ? balance : 0;
      const extraPayable = balance < 0 ? Math.abs(balance) : 0;

      // 3. Create closing record
      const closing = await prisma.tripClosing.create({
        data: {
          tripId,
          totalCashGiven,
          totalExpenses,
          remainingBalance,
          extraPayable,
          closedById: session.userId,
        },
        include: {
          trip: { select: { tripNumber: true, driverId: true } }
        }
      });

      // 4. Update trip status to DELIVERED / CLOSED
      await prisma.trip.update({
        where: { id: tripId },
        data: { status: "DELIVERED" }
      });

      // 5. Adjust driver balances (clear outstanding trip advance)
      if (closing.trip?.driverId) {
        await prisma.driver.update({
          where: { id: closing.trip.driverId },
          data: {
            advanceBalance: { decrement: totalCashGiven }
          }
        });
      }

      return NextResponse.json({
        success: true,
        live: true,
        data: {
          ...closing,
          totalCashGiven: Number(closing.totalCashGiven),
          totalExpenses: Number(closing.totalExpenses),
          remainingBalance: Number(closing.remainingBalance),
          extraPayable: Number(closing.extraPayable),
          tripNumber: closing.trip?.tripNumber || "Unknown"
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, closing in mock memory.");
      
      const mockNew = {
        id: `close-${Date.now()}`,
        tripId,
        tripNumber: "TRIP-MOCK-NUM",
        totalCashGiven: 2000.00,
        totalExpenses: 1850.00,
        remainingBalance: 150.00,
        extraPayable: 0.00,
        closedDate: new Date().toISOString(),
      };
      mockTripClosings = [mockNew, ...mockTripClosings];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
