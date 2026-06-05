import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

let mockTrips = [
  {
    id: "trip-1",
    tripNumber: "TRIP-2026-001",
    customerId: "cust-1",
    customerName: "Almarai Company",
    driverId: "drv-1",
    driverName: "Muhammad Khan",
    truckId: "trk-1",
    truckNumber: "TRK-01-SHJ",
    fromCountry: "UAE",
    toCountry: "Saudi Arabia",
    loadingPoint: "Sharjah Port",
    deliveryPoint: "Riyadh Logistics Zone",
    doNumber: "DO-99281",
    cargoType: "Chemical Tank",
    tripAmount: 8500.00,
    status: "IN_TRANSIT",
    createdAt: "2026-06-01T12:00:00.000Z",
  },
  {
    id: "trip-2",
    tripNumber: "TRIP-2026-002",
    customerId: "cust-2",
    customerName: "Emaar Properties PJSC",
    driverId: "drv-2",
    driverName: "Amrit Singh",
    truckId: "trk-2",
    truckNumber: "TRK-02-DXB",
    fromCountry: "UAE",
    toCountry: "Oman",
    loadingPoint: "Jebel Ali Port",
    deliveryPoint: "Muscat City Center",
    doNumber: "DO-11827",
    cargoType: "Construction Materials",
    tripAmount: 4200.00,
    status: "LOADING",
    createdAt: "2026-06-03T09:30:00.000Z",
  },
  {
    id: "trip-3",
    tripNumber: "TRIP-2026-003",
    customerId: "cust-3",
    customerName: "Kuwait Petroleum Corporation",
    driverId: "drv-1",
    driverName: "Muhammad Khan",
    truckId: "trk-1",
    truckNumber: "TRK-01-SHJ",
    fromCountry: "Kuwait",
    toCountry: "UAE",
    loadingPoint: "Mina Al-Ahmadi",
    deliveryPoint: "Ruwais Refinery, Abu Dhabi",
    doNumber: "DO-88741",
    cargoType: "Lube Oil Drums",
    tripAmount: 12500.00,
    status: "DELIVERED",
    createdAt: "2026-05-28T14:20:00.000Z",
  }
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const trips = await prisma.trip.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          driver: { select: { name: true } },
          truck: { select: { truckNumber: true } },
          invoice: { select: { id: true } }
        },
      });

      const formatted = trips.map(t => ({
        ...t,
        tripAmount: Number(t.tripAmount),
        customerName: t.customer?.name || "Unknown",
        driverName: t.driver?.name || "Unknown",
        truckNumber: t.truck?.truckNumber || "Unknown",
        hasInvoice: !!t.invoice,
      }));

      return NextResponse.json({ live: true, data: formatted });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock trips.");
      return NextResponse.json({ live: false, data: mockTrips });
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
      customerId,
      driverId,
      truckId,
      fromCountry,
      toCountry,
      loadingPoint,
      deliveryPoint,
      doNumber,
      cargoType,
      tripAmount,
      status,
    } = body;

    if (!customerId || !driverId || !truckId || !fromCountry || !toCountry || !tripAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tripNum = `TRIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const newTrip = await prisma.trip.create({
        data: {
          tripNumber: tripNum,
          customerId,
          driverId,
          truckId,
          fromCountry,
          toCountry,
          loadingPoint: loadingPoint || "",
          deliveryPoint: deliveryPoint || "",
          doNumber: doNumber || "",
          cargoType: cargoType || "",
          tripAmount: parseFloat(tripAmount),
          status: status || "LOADING",
        },
        include: {
          customer: { select: { name: true } },
          driver: { select: { name: true } },
          truck: { select: { truckNumber: true } },
        }
      });

      return NextResponse.json({
        success: true,
        live: true,
        data: {
          ...newTrip,
          tripAmount: Number(newTrip.tripAmount),
          customerName: newTrip.customer?.name || "Unknown",
          driverName: newTrip.driver?.name || "Unknown",
          truckNumber: newTrip.truck?.truckNumber || "Unknown",
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, adding to mock memory.");
      const mockNew = {
        id: `trip-${Date.now()}`,
        tripNumber: tripNum,
        customerId,
        customerName: "Mock Customer Profile",
        driverId,
        driverName: "Mock Driver",
        truckId,
        truckNumber: "Mock Truck",
        fromCountry,
        toCountry,
        loadingPoint,
        deliveryPoint,
        doNumber,
        cargoType,
        tripAmount: parseFloat(tripAmount),
        status: status || "LOADING",
        createdAt: new Date().toISOString()
      };
      mockTrips = [mockNew, ...mockTrips];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
