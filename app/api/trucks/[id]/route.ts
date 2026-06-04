import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    if (!id) {
      return NextResponse.json({ error: "Truck ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const {
      truckNumber,
      plateNumber,
      trailerNumber,
      type,
      registrationExpiry,
      insuranceExpiry,
      status,
      assignedDriverId
    } = body;

    if (!truckNumber || !plateNumber || !type || !registrationExpiry || !insuranceExpiry) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      const updated = await prisma.truck.update({
        where: { id },
        data: {
          truckNumber,
          plateNumber,
          trailerNumber: trailerNumber || "",
          type,
          registrationExpiry: new Date(registrationExpiry),
          insuranceExpiry: new Date(insuranceExpiry),
          status: status || "AVAILABLE",
          assignedDriverId: assignedDriverId || null,
        },
        include: {
          assignedDriver: { select: { name: true } }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          driverName: updated.assignedDriver?.name || "Unassigned"
        },
      });
    } catch (dbError) {
      console.error("DB error updating truck:", dbError);
      return NextResponse.json({ error: "Database error updating truck" }, { status: 500 });
    }
  } catch (error) {
    console.error("Truck dynamic API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
