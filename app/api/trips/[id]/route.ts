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
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
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

    if (!customerId || !driverId || !truckId || !fromCountry || !toCountry || tripAmount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      const updated = await prisma.trip.update({
        where: { id },
        data: {
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
        data: {
          ...updated,
          tripAmount: Number(updated.tripAmount),
          customerName: updated.customer?.name || "Unknown",
          driverName: updated.driver?.name || "Unknown",
          truckNumber: updated.truck?.truckNumber || "Unknown",
        },
      });
    } catch (dbError) {
      console.error("DB error updating trip:", dbError);
      return NextResponse.json({ error: "Database error updating trip" }, { status: 500 });
    }
  } catch (error) {
    console.error("Trip dynamic API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
