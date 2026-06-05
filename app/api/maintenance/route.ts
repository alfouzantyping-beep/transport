import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (vehicleId) {
      whereClause.vehicleId = vehicleId;
    }
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { workshopName: { contains: search } },
        { maintenanceType: { contains: search } },
        { description: { contains: search } },
        { vehicle: { truckNo: { contains: search } } }
      ];
    }

    const logs = await prisma.vehicleMaintenance.findMany({
      where: whereClause,
      orderBy: { maintenanceDate: "desc" },
      include: {
        vehicle: true
      }
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET Maintenance error:", error);
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
      vehicleId,
      maintenanceDate,
      maintenanceType,
      workshopName,
      amount,
      odometer,
      nextServiceDate,
      description = "",
      invoiceImageUrl = "",
      status = "COMPLETED"
    } = body;

    // VALIDATION checks
    if (!vehicleId) {
      return NextResponse.json({ error: "Vehicle is required" }, { status: 400 });
    }
    if (!maintenanceDate) {
      return NextResponse.json({ error: "Maintenance date is required" }, { status: 400 });
    }
    if (!maintenanceType) {
      return NextResponse.json({ error: "Maintenance type is required" }, { status: 400 });
    }
    if (!workshopName) {
      return NextResponse.json({ error: "Workshop name is required" }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    let parsedOdometer: number | null = null;
    if (odometer !== undefined && odometer !== null && odometer !== "") {
      parsedOdometer = Number(odometer);
      if (isNaN(parsedOdometer) || !Number.isInteger(parsedOdometer) || parsedOdometer < 0) {
        return NextResponse.json({ error: "Odometer must be a positive integer if entered" }, { status: 400 });
      }
    }

    const newLog = await prisma.vehicleMaintenance.create({
      data: {
        vehicleId,
        maintenanceDate: new Date(maintenanceDate),
        maintenanceType,
        workshopName,
        amount: parsedAmount,
        odometer: parsedOdometer,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
        description,
        invoiceImageUrl,
        status
      },
      include: {
        vehicle: true
      }
    });

    return NextResponse.json(newLog);
  } catch (error: any) {
    console.error("POST Maintenance error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
