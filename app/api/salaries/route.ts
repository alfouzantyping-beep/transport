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
    const driverId = searchParams.get("driverId");
    const month = searchParams.get("salaryMonth");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (driverId) {
      whereClause.driverId = driverId;
    }
    if (month) {
      whereClause.salaryMonth = month;
    }
    if (search) {
      whereClause.OR = [
        { driver: { name: { contains: search } } },
        { salaryMonth: { contains: search } }
      ];
    }

    const salaries = await prisma.driverMonthlySalary.findMany({
      where: whereClause,
      orderBy: { salaryMonth: "desc" },
      include: {
        driver: true
      }
    });

    return NextResponse.json(salaries);
  } catch (error: any) {
    console.error("GET Salaries error:", error);
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
      salaryMonth,
      basicSalary,
      roomRentDeduction = 0,
      advanceDeduction = 0,
      trafficFineDeduction = 0,
      visaDeduction = 0,
      otherDeduction = 0,
      tripSettlementAdjustment = 0,
      paidAmount = 0,
      notes = ""
    } = body;

    if (!driverId || !salaryMonth || basicSalary === undefined) {
      return NextResponse.json({ error: "Missing required salary fields" }, { status: 400 });
    }

    const bs = Number(basicSalary);
    const rrd = Number(roomRentDeduction);
    const ad = Number(advanceDeduction);
    const tfd = Number(trafficFineDeduction);
    const vd = Number(visaDeduction);
    const od = Number(otherDeduction);
    const tsa = Number(tripSettlementAdjustment);
    const pa = Number(paidAmount);

    const totalDeduction = rrd + ad + tfd + vd + od;
    const netSalary = bs + tsa - totalDeduction;
    const balance = netSalary - pa;

    let status = "PENDING";
    if (balance <= 0) {
      status = "PAID";
    } else if (pa > 0) {
      status = "PARTIAL";
    }

    // Run creation and driver balance updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const salary = await tx.driverMonthlySalary.create({
        data: {
          driverId,
          salaryMonth,
          basicSalary: bs,
          roomRentDeduction: rrd,
          advanceDeduction: ad,
          trafficFineDeduction: tfd,
          visaDeduction: vd,
          otherDeduction: od,
          tripSettlementAdjustment: tsa,
          totalDeduction,
          netSalary,
          paidAmount: pa,
          balance,
          status,
          notes
        },
        include: {
          driver: true
        }
      });

      // Update driver advance balance and visa balance
      await tx.driver.update({
        where: { id: driverId },
        data: {
          advanceBalance: { decrement: ad },
          visaBalance: { decrement: vd }
        }
      });

      return salary;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST Salary error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
