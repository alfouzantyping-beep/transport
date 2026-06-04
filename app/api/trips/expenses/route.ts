import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

let mockTripExpenses = [
  {
    id: "exp-1",
    tripId: "trip-1",
    tripNumber: "TRIP-2026-001",
    diesel: 800.00,
    petrol: 0.00,
    toll: 150.00,
    border: 300.00,
    visa: 150.00,
    customs: 100.00,
    food: 200.00,
    parking: 50.00,
    maintenance: 0.00,
    hotel: 0.00,
    other: 0.00,
    notes: "UAE to KSA border expenses logged by driver",
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
      const expenses = await prisma.tripExpense.findMany({
        where: tripId ? { tripId } : {},
        orderBy: { createdAt: "desc" },
        include: {
          trip: { select: { tripNumber: true } }
        }
      });

      const formatted = expenses.map(e => ({
        ...e,
        diesel: Number(e.diesel),
        petrol: Number(e.petrol),
        toll: Number(e.toll),
        border: Number(e.border),
        visa: Number(e.visa),
        customs: Number(e.customs),
        food: Number(e.food),
        parking: Number(e.parking),
        maintenance: Number(e.maintenance),
        hotel: Number(e.hotel),
        other: Number(e.other),
        qatarVisa: Number(e.qatarVisa || 0),
        qatarToll: Number(e.qatarToll || 0),
        ksaVisa: Number(e.ksaVisa || 0),
        uaeCustoms: Number(e.uaeCustoms || 0),
        ksaCustoms: Number(e.ksaCustoms || 0),
        mezan: Number(e.mezan || 0),
        jordanBorder: Number(e.jordanBorder || 0),
        cameraFine: Number(e.cameraFine || 0),
        hayaPeshgi: Number(e.hayaPeshgi || 0),
        gatePass: Number(e.gatePass || 0),
        tripNumber: e.trip?.tripNumber || "Unknown"
      }));

      return NextResponse.json({ live: true, data: formatted });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock trip expenses.");
      const filteredMock = tripId ? mockTripExpenses.filter(e => e.tripId === tripId) : mockTripExpenses;
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
    const {
      tripId,
      diesel,
      petrol,
      toll,
      border,
      visa,
      customs,
      food,
      parking,
      maintenance,
      hotel,
      other,
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
      notes
    } = body;

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    try {
      const existing = await prisma.tripExpense.findFirst({
        where: { tripId }
      });

      let expense;
      if (existing) {
        expense = await prisma.tripExpense.update({
          where: { id: existing.id },
          data: {
            diesel: parseFloat(diesel || 0),
            petrol: parseFloat(petrol || 0),
            toll: parseFloat(toll || 0),
            border: parseFloat(border || 0),
            visa: parseFloat(visa || 0),
            customs: parseFloat(customs || 0),
            food: parseFloat(food || 0),
            parking: parseFloat(parking || 0),
            maintenance: parseFloat(maintenance || 0),
            hotel: parseFloat(hotel || 0),
            other: parseFloat(other || 0),
            qatarVisa: parseFloat(qatarVisa || 0),
            qatarToll: parseFloat(qatarToll || 0),
            ksaVisa: parseFloat(ksaVisa || 0),
            uaeCustoms: parseFloat(uaeCustoms || 0),
            ksaCustoms: parseFloat(ksaCustoms || 0),
            mezan: parseFloat(mezan || 0),
            jordanBorder: parseFloat(jordanBorder || 0),
            cameraFine: parseFloat(cameraFine || 0),
            hayaPeshgi: parseFloat(hayaPeshgi || 0),
            gatePass: parseFloat(gatePass || 0),
            notes: notes || ""
          },
          include: {
            trip: { select: { tripNumber: true } }
          }
        });
      } else {
        expense = await prisma.tripExpense.create({
          data: {
            tripId,
            diesel: parseFloat(diesel || 0),
            petrol: parseFloat(petrol || 0),
            toll: parseFloat(toll || 0),
            border: parseFloat(border || 0),
            visa: parseFloat(visa || 0),
            customs: parseFloat(customs || 0),
            food: parseFloat(food || 0),
            parking: parseFloat(parking || 0),
            maintenance: parseFloat(maintenance || 0),
            hotel: parseFloat(hotel || 0),
            other: parseFloat(other || 0),
            qatarVisa: parseFloat(qatarVisa || 0),
            qatarToll: parseFloat(qatarToll || 0),
            ksaVisa: parseFloat(ksaVisa || 0),
            uaeCustoms: parseFloat(uaeCustoms || 0),
            ksaCustoms: parseFloat(ksaCustoms || 0),
            mezan: parseFloat(mezan || 0),
            jordanBorder: parseFloat(jordanBorder || 0),
            cameraFine: parseFloat(cameraFine || 0),
            hayaPeshgi: parseFloat(hayaPeshgi || 0),
            gatePass: parseFloat(gatePass || 0),
            notes: notes || ""
          },
          include: {
            trip: { select: { tripNumber: true } }
          }
        });
      }

      return NextResponse.json({
        success: true,
        live: true,
        data: {
          ...expense,
          diesel: Number(expense.diesel),
          petrol: Number(expense.petrol),
          toll: Number(expense.toll),
          border: Number(expense.border),
          visa: Number(expense.visa),
          customs: Number(expense.customs),
          food: Number(expense.food),
          parking: Number(expense.parking),
          maintenance: Number(expense.maintenance),
          hotel: Number(expense.hotel),
          other: Number(expense.other),
          qatarVisa: Number(expense.qatarVisa || 0),
          qatarToll: Number(expense.qatarToll || 0),
          ksaVisa: Number(expense.ksaVisa || 0),
          uaeCustoms: Number(expense.uaeCustoms || 0),
          ksaCustoms: Number(expense.ksaCustoms || 0),
          mezan: Number(expense.mezan || 0),
          jordanBorder: Number(expense.jordanBorder || 0),
          cameraFine: Number(expense.cameraFine || 0),
          hayaPeshgi: Number(expense.hayaPeshgi || 0),
          gatePass: Number(expense.gatePass || 0),
          tripNumber: expense.trip?.tripNumber || "Unknown"
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, logging in mock memory.");
      const mockNew = {
        id: `exp-${Date.now()}`,
        tripId,
        tripNumber: "TRIP-MOCK-NUM",
        diesel: parseFloat(diesel || 0),
        petrol: parseFloat(petrol || 0),
        toll: parseFloat(toll || 0),
        border: parseFloat(border || 0),
        visa: parseFloat(visa || 0),
        customs: parseFloat(customs || 0),
        food: parseFloat(food || 0),
        parking: parseFloat(parking || 0),
        maintenance: parseFloat(maintenance || 0),
        hotel: parseFloat(hotel || 0),
        other: parseFloat(other || 0),
        qatarVisa: parseFloat(qatarVisa || 0),
        qatarToll: parseFloat(qatarToll || 0),
        ksaVisa: parseFloat(ksaVisa || 0),
        uaeCustoms: parseFloat(uaeCustoms || 0),
        ksaCustoms: parseFloat(ksaCustoms || 0),
        mezan: parseFloat(mezan || 0),
        jordanBorder: parseFloat(jordanBorder || 0),
        cameraFine: parseFloat(cameraFine || 0),
        hayaPeshgi: parseFloat(hayaPeshgi || 0),
        gatePass: parseFloat(gatePass || 0),
        notes: notes || ""
      };
      mockTripExpenses = [mockNew, ...mockTripExpenses];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
