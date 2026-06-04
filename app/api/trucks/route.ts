import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

let mockTrucks = [
  {
    id: "trk-1",
    truckNumber: "TRK-01-SHJ",
    plateNumber: "SHJ 12903",
    trailerNumber: "TRL-908",
    type: "Flatbed Trailer",
    registrationExpiry: "2027-05-15T00:00:00.000Z",
    insuranceExpiry: "2027-05-15T00:00:00.000Z",
    assignedDriverId: "drv-1",
    assignedDriverName: "Muhammad Khan",
    status: "AVAILABLE",
  },
  {
    id: "trk-2",
    truckNumber: "TRK-02-DXB",
    plateNumber: "DXB 88274",
    trailerNumber: "TRL-774",
    type: "Chemical Tanker",
    registrationExpiry: "2027-08-20T00:00:00.000Z",
    insuranceExpiry: "2027-08-20T00:00:00.000Z",
    assignedDriverId: "drv-2",
    assignedDriverName: "Amrit Singh",
    status: "IN_TRIP",
  },
  {
    id: "trk-3",
    truckNumber: "TRK-03-KSA",
    plateNumber: "KSA-RIY-9981",
    trailerNumber: "TRL-101",
    type: "Reefer Trailer",
    registrationExpiry: "2026-12-01T00:00:00.000Z",
    insuranceExpiry: "2026-12-01T00:00:00.000Z",
    assignedDriverId: "drv-3",
    assignedDriverName: "Sajid Khan",
    status: "MAINTENANCE",
  }
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const trucks = await prisma.truck.findMany({
        orderBy: { truckNumber: "asc" },
        include: {
          assignedDriver: { select: { name: true } },
        },
      });

      const formatted = trucks.map(t => ({
        ...t,
        assignedDriverName: t.assignedDriver?.name || "Unassigned"
      }));

      return NextResponse.json({ live: true, data: formatted });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock trucks.");
      return NextResponse.json({ live: false, data: mockTrucks });
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
    const { truckNumber, plateNumber, trailerNumber, type, registrationExpiry, insuranceExpiry, assignedDriverId, status } = body;

    if (!truckNumber || !plateNumber || !type || !registrationExpiry || !insuranceExpiry) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      const newTruck = await prisma.truck.create({
        data: {
          truckNumber,
          plateNumber,
          trailerNumber: trailerNumber || "",
          type,
          registrationExpiry: new Date(registrationExpiry),
          insuranceExpiry: new Date(insuranceExpiry),
          assignedDriverId: assignedDriverId || null,
          status: status || "AVAILABLE"
        },
        include: {
          assignedDriver: { select: { name: true } }
        }
      });
      return NextResponse.json({
        success: true,
        live: true,
        data: {
          ...newTruck,
          assignedDriverName: newTruck.assignedDriver?.name || "Unassigned"
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, adding to mock memory.");
      const mockNew = {
        id: `trk-${Date.now()}`,
        truckNumber,
        plateNumber,
        trailerNumber,
        type,
        registrationExpiry: new Date(registrationExpiry).toISOString(),
        insuranceExpiry: new Date(insuranceExpiry).toISOString(),
        assignedDriverId: assignedDriverId || null,
        assignedDriverName: "Mock User",
        status: status || "AVAILABLE"
      };
      mockTrucks = [mockNew, ...mockTrucks];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
