import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

let mockDriverCash = [
  {
    id: "cash-1",
    tripId: "trip-1",
    tripNumber: "TRIP-2026-001",
    amount: 1500.00,
    date: "2026-06-01T00:00:00.000Z",
    paymentMethod: "CASH",
    notes: "Advance for Diesel and border clearing",
  },
  {
    id: "cash-2",
    tripId: "trip-2",
    tripNumber: "TRIP-2026-002",
    amount: 800.00,
    date: "2026-06-03T00:00:00.000Z",
    paymentMethod: "BANK_TRANSFER",
    notes: "Driver basic allowance",
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
      const logs = await prisma.driverCash.findMany({
        where: tripId ? { tripId } : {},
        orderBy: { date: "desc" },
        include: {
          trip: { select: { tripNumber: true } }
        }
      });

      const formatted = logs.map(l => ({
        ...l,
        amount: Number(l.amount),
        tripNumber: l.trip?.tripNumber || "Unknown"
      }));

      return NextResponse.json({ live: true, data: formatted });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock driver cash.");
      const filteredMock = tripId ? mockDriverCash.filter(c => c.tripId === tripId) : mockDriverCash;
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
    const { tripId, amount, date, paymentMethod, notes } = body;

    if (!tripId || !amount || !date) {
      return NextResponse.json({ error: "Trip ID, Amount, and Date are required" }, { status: 400 });
    }

    try {
      const log = await prisma.driverCash.create({
        data: {
          tripId,
          amount: parseFloat(amount),
          date: new Date(date),
          paymentMethod: paymentMethod || "CASH",
          notes: notes || ""
        },
        include: {
          trip: { select: { tripNumber: true } }
        }
      });

      // Update driver advance balance as well
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { driverId: true }
      });
      if (trip) {
        await prisma.driver.update({
          where: { id: trip.driverId },
          data: { advanceBalance: { increment: parseFloat(amount) } }
        });
      }

      return NextResponse.json({
        success: true,
        live: true,
        data: {
          ...log,
          amount: Number(log.amount),
          tripNumber: log.trip?.tripNumber || "Unknown"
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, logging in mock memory.");
      const mockNew = {
        id: `cash-${Date.now()}`,
        tripId,
        tripNumber: "TRIP-MOCK-NUM",
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        paymentMethod: paymentMethod || "CASH",
        notes: notes || ""
      };
      mockDriverCash = [mockNew, ...mockDriverCash];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
