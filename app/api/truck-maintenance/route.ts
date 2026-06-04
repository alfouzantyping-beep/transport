import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

let mockMaintenances = [
  {
    id: "maint-1",
    truckId: "trk-3",
    truckNumber: "TRK-03-KSA",
    date: "2026-06-02T00:00:00.000Z",
    oilChange: 350.00,
    tyre: 0.00,
    battery: 0.00,
    engineRepair: 500.00,
    brakeRepair: 0.00,
    service: 0.00,
    passing: 0.00,
    insurance: 0.00,
    amount: 850.00,
    workshop: "Al-Barakah Workshop, Sharjah",
    notes: "Engine diagnostics and Mobil oil change completed",
  }
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const logs = await prisma.truckMaintenance.findMany({
        orderBy: { date: "desc" },
        include: {
          truck: { select: { truckNumber: true } }
        }
      });

      const formatted = logs.map(l => ({
        ...l,
        oilChange: Number(l.oilChange),
        tyre: Number(l.tyre),
        battery: Number(l.battery),
        engineRepair: Number(l.engineRepair),
        brakeRepair: Number(l.brakeRepair),
        service: Number(l.service),
        passing: Number(l.passing),
        insurance: Number(l.insurance),
        amount: Number(l.amount),
        truckNumber: l.truck?.truckNumber || "Unknown"
      }));

      return NextResponse.json({ live: true, data: formatted });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock maintenance logs.");
      return NextResponse.json({ live: false, data: mockMaintenances });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 550 });
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
      truckId,
      date,
      oilChange,
      tyre,
      battery,
      engineRepair,
      brakeRepair,
      service,
      passing,
      insurance,
      workshop,
      notes
    } = body;

    if (!truckId || !date || !workshop) {
      return NextResponse.json({ error: "Truck, Date, and Workshop are required" }, { status: 400 });
    }

    const oil = parseFloat(oilChange || 0);
    const tyr = parseFloat(tyre || 0);
    const bat = parseFloat(battery || 0);
    const engine = parseFloat(engineRepair || 0);
    const brake = parseFloat(brakeRepair || 0);
    const svc = parseFloat(service || 0);
    const pass = parseFloat(passing || 0);
    const ins = parseFloat(insurance || 0);
    const total = oil + tyr + bat + engine + brake + svc + pass + ins;

    try {
      const log = await prisma.truckMaintenance.create({
        data: {
          truckId,
          date: new Date(date),
          oilChange: oil,
          tyre: tyr,
          battery: bat,
          engineRepair: engine,
          brakeRepair: brake,
          service: svc,
          passing: pass,
          insurance: ins,
          amount: total,
          workshop,
          notes: notes || "",
        },
        include: {
          truck: { select: { truckNumber: true } }
        }
      });

      return NextResponse.json({
        success: true,
        live: true,
        data: {
          ...log,
          oilChange: Number(log.oilChange),
          tyre: Number(log.tyre),
          battery: Number(log.battery),
          engineRepair: Number(log.engineRepair),
          brakeRepair: Number(log.brakeRepair),
          service: Number(log.service),
          passing: Number(log.passing),
          insurance: Number(log.insurance),
          amount: Number(log.amount),
          truckNumber: log.truck?.truckNumber || "Unknown"
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, logging mock maintenance.");
      const mockNew = {
        id: `maint-${Date.now()}`,
        truckId,
        truckNumber: "TRK-MOCK-NUM",
        date: new Date(date).toISOString(),
        oilChange: oil,
        tyre: tyr,
        battery: bat,
        engineRepair: engine,
        brakeRepair: brake,
        service: svc,
        passing: pass,
        insurance: ins,
        amount: total,
        workshop,
        notes,
      };
      mockMaintenances = [mockNew, ...mockMaintenances];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
