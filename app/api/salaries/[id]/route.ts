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

    const salary = await prisma.driverMonthlySalary.findUnique({
      where: { id },
      include: {
        driver: true
      }
    });

    if (!salary) {
      return NextResponse.json({ error: "Salary record not found" }, { status: 404 });
    }

    return NextResponse.json(salary);
  } catch (error: any) {
    console.error("GET Salary by ID error:", error);
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
      basicSalary,
      roomRentDeduction,
      advanceDeduction,
      trafficFineDeduction,
      visaDeduction,
      otherDeduction,
      tripSettlementAdjustment,
      paidAmount,
      notes
    } = body;

    const oldSalary = await prisma.driverMonthlySalary.findUnique({
      where: { id }
    });

    if (!oldSalary) {
      return NextResponse.json({ error: "Salary record not found" }, { status: 404 });
    }

    const bs = basicSalary !== undefined ? Number(basicSalary) : oldSalary.basicSalary;
    const rrd = roomRentDeduction !== undefined ? Number(roomRentDeduction) : oldSalary.roomRentDeduction;
    const ad = advanceDeduction !== undefined ? Number(advanceDeduction) : oldSalary.advanceDeduction;
    const tfd = trafficFineDeduction !== undefined ? Number(trafficFineDeduction) : oldSalary.trafficFineDeduction;
    const vd = visaDeduction !== undefined ? Number(visaDeduction) : oldSalary.visaDeduction;
    const od = otherDeduction !== undefined ? Number(otherDeduction) : oldSalary.otherDeduction;
    const tsa = tripSettlementAdjustment !== undefined ? Number(tripSettlementAdjustment) : oldSalary.tripSettlementAdjustment;
    const pa = paidAmount !== undefined ? Number(paidAmount) : oldSalary.paidAmount;
    const nt = notes !== undefined ? notes : oldSalary.notes;

    const totalDeduction = rrd + ad + tfd + vd + od;
    const netSalary = bs + tsa - totalDeduction;
    const balance = netSalary - pa;

    let status = "PENDING";
    if (balance <= 0) {
      status = "PAID";
    } else if (pa > 0) {
      status = "PARTIAL";
    }

    const result = await prisma.$transaction(async (tx) => {
      // Revert old deductions from driver balance
      await tx.driver.update({
        where: { id: oldSalary.driverId },
        data: {
          advanceBalance: { increment: oldSalary.advanceDeduction },
          visaBalance: { increment: oldSalary.visaDeduction }
        }
      });

      // Apply new deductions to driver balance
      await tx.driver.update({
        where: { id: oldSalary.driverId },
        data: {
          advanceBalance: { decrement: ad },
          visaBalance: { decrement: vd }
        }
      });

      // Update salary record
      const updated = await tx.driverMonthlySalary.update({
        where: { id },
        data: {
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
          notes: nt
        },
        include: {
          driver: true
        }
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PUT Salary error:", error);
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

    const salary = await prisma.driverMonthlySalary.findUnique({
      where: { id }
    });

    if (!salary) {
      return NextResponse.json({ error: "Salary record not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Revert deductions on driver profile
      await tx.driver.update({
        where: { id: salary.driverId },
        data: {
          advanceBalance: { increment: salary.advanceDeduction },
          visaBalance: { increment: salary.visaDeduction }
        }
      });

      // Delete salary record
      await tx.driverMonthlySalary.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Salary record deleted and driver balances reverted" });
  } catch (error: any) {
    console.error("DELETE Salary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
