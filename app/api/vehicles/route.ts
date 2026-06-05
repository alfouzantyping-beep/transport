import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vehicles = await prisma.vehicle.findMany({
      orderBy: { truckNo: "asc" }
    });

    return NextResponse.json(vehicles);
  } catch (error: any) {
    console.error("GET Vehicles API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
