import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

let mockSalaries = [
  {
    id: "sal-1",
    driverId: "drv-1",
    driverName: "Muhammad Khan",
    month: 5,
    year: 2026,
    baseSalary: 4500.00,
    advanceDeduction: 350.00,
    fineDeduction: 100.00,
    visaDeduction: 0.00,
    roomDeduction: 150.00,
    netSalary: 3900.00,
    paymentDate: "2026-05-31T00:00:00.000Z",
    notes: "May monthly payroll settled",
  }
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const salaries = await prisma.salary.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          driver: { select: { name: true } },
        }
      });

      const formatted = salaries.map(s => ({
        ...s,
        baseSalary: Number(s.baseSalary),
        advanceDeduction: Number(s.advanceDeduction),
        fineDeduction: Number(s.fineDeduction),
        visaDeduction: Number(s.visaDeduction),
        roomDeduction: Number(s.roomDeduction),
        netSalary: Number(s.netSalary),
        driverName: s.driver?.name || "Unknown",
      }));

      return NextResponse.json({ live: true, data: formatted });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock salaries.");
      return NextResponse.json({ live: false, data: mockSalaries });
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
      driverId,
      month,
      year,
      baseSalary,
      advanceDeduction,
      fineDeduction,
      visaDeduction,
      roomDeduction,
      paymentDate,
      notes
    } = body;

    if (!driverId || !month || !year || !baseSalary || !paymentDate) {
      return NextResponse.json({ error: "Missing required payroll fields" }, { status: 400 });
    }

    const base = parseFloat(baseSalary);
    const adv = parseFloat(advanceDeduction || 0);
    const fine = parseFloat(fineDeduction || 0);
    const visa = parseFloat(visaDeduction || 0);
    const room = parseFloat(roomDeduction || 0);
    const net = base - (adv + fine + visa + room);

    try {
      const salary = await prisma.salary.create({
        data: {
          driverId,
          month: parseInt(month, 10),
          year: parseInt(year, 10),
          baseSalary: base,
          advanceDeduction: adv,
          fineDeduction: fine,
          visaDeduction: visa,
          roomDeduction: room,
          netSalary: net,
          paymentDate: new Date(paymentDate),
          notes: notes || "",
        },
        include: {
          driver: { select: { name: true } }
        }
      });

      // Deduct driver advance balance and visa balance accordingly
      await prisma.driver.update({
        where: { id: driverId },
        data: {
          advanceBalance: { decrement: adv },
          visaBalance: { decrement: visa }
        }
      });

      return NextResponse.json({
        success: true,
        live: true,
        data: {
          ...salary,
          baseSalary: Number(salary.baseSalary),
          advanceDeduction: Number(salary.advanceDeduction),
          fineDeduction: Number(salary.fineDeduction),
          visaDeduction: Number(salary.visaDeduction),
          roomDeduction: Number(salary.roomDeduction),
          netSalary: Number(salary.netSalary),
          driverName: salary.driver?.name || "Unknown",
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, logging mock salary.");
      const mockNew = {
        id: `sal-${Date.now()}`,
        driverId,
        driverName: "Mock Driver",
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        baseSalary: base,
        advanceDeduction: adv,
        fineDeduction: fine,
        visaDeduction: visa,
        roomDeduction: room,
        netSalary: net,
        paymentDate: new Date(paymentDate).toISOString(),
        notes,
      };
      mockSalaries = [mockNew, ...mockSalaries];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
