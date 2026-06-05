import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const log = await prisma.vehicleMaintenance.findUnique({
      where: { id },
      include: {
        vehicle: true
      }
    });

    if (!log) {
      return NextResponse.json({ error: "Maintenance log not found" }, { status: 404 });
    }

    return NextResponse.json(log);
  } catch (error: any) {
    console.error("GET Maintenance by ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      vehicleId,
      maintenanceDate,
      maintenanceType,
      workshopName,
      amount,
      odometer,
      nextServiceDate,
      description,
      invoiceImageUrl,
      status
    } = body;

    const log = await prisma.vehicleMaintenance.findUnique({
      where: { id }
    });

    if (!log) {
      return NextResponse.json({ error: "Maintenance log not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (vehicleId !== undefined) {
      if (!vehicleId) {
        return NextResponse.json({ error: "Vehicle is required" }, { status: 400 });
      }
      updateData.vehicleId = vehicleId;
    }

    if (maintenanceDate !== undefined) {
      if (!maintenanceDate) {
        return NextResponse.json({ error: "Maintenance date is required" }, { status: 400 });
      }
      updateData.maintenanceDate = new Date(maintenanceDate);
    }

    if (maintenanceType !== undefined) {
      if (!maintenanceType) {
        return NextResponse.json({ error: "Maintenance type is required" }, { status: 400 });
      }
      updateData.maintenanceType = maintenanceType;
    }

    if (workshopName !== undefined) {
      if (!workshopName) {
        return NextResponse.json({ error: "Workshop name is required" }, { status: 400 });
      }
      updateData.workshopName = workshopName;
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
      }
      updateData.amount = parsedAmount;
    }

    if (odometer !== undefined) {
      if (odometer === null || odometer === "") {
        updateData.odometer = null;
      } else {
        const parsedOdometer = Number(odometer);
        if (isNaN(parsedOdometer) || !Number.isInteger(parsedOdometer) || parsedOdometer < 0) {
          return NextResponse.json({ error: "Odometer must be a positive integer if entered" }, { status: 400 });
        }
        updateData.odometer = parsedOdometer;
      }
    }

    if (nextServiceDate !== undefined) {
      updateData.nextServiceDate = nextServiceDate ? new Date(nextServiceDate) : null;
    }
    if (description !== undefined) updateData.description = description;
    if (invoiceImageUrl !== undefined) updateData.invoiceImageUrl = invoiceImageUrl;
    if (status !== undefined) updateData.status = status;

    const updatedLog = await prisma.vehicleMaintenance.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true
      }
    });

    return NextResponse.json(updatedLog);
  } catch (error: any) {
    console.error("PUT Maintenance error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const log = await prisma.vehicleMaintenance.findUnique({
      where: { id }
    });

    if (!log) {
      return NextResponse.json({ error: "Maintenance log not found" }, { status: 404 });
    }

    await prisma.vehicleMaintenance.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Maintenance record deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Maintenance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
