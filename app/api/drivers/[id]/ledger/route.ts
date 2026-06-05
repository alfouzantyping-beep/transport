import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
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
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });
    }

    try {
      // 1. Fetch Driver details
      const driver = await prisma.driver.findUnique({
        where: { id },
      });

      if (!driver) {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 });
      }

      // 2. Fetch all trips for this driver sorted chronologically
      const trips = await prisma.trip.findMany({
        where: { driverId: id },
        orderBy: { createdAt: "asc" },
        include: {
          customer: { select: { name: true } },
          truck: { select: { truckNumber: true, plateNumber: true } },
          driverCash: true,
          expenses: true,
        },
      });

      // 3. Compile Petty Cash ledger rows
      let runningBalance = 0;
      const pettyCashLedger = trips.map((trip) => {
        // Sum driver cash advances given for this trip
        const pettyCashIssued = trip.driverCash.reduce((sum, cash) => sum + Number(cash.amount), 0);

        // Sum and aggregate expenses across all logged entries for this trip (typically there's 1)
        const qatarVisa = trip.expenses.reduce((sum, exp) => sum + Number(exp.qatarVisa || 0), 0);
        const qatarToll = trip.expenses.reduce((sum, exp) => sum + Number(exp.qatarToll || 0), 0);
        const ksaVisa = trip.expenses.reduce((sum, exp) => sum + Number(exp.ksaVisa || 0), 0);
        const uaeCustoms = trip.expenses.reduce((sum, exp) => sum + Number(exp.uaeCustoms || 0), 0);
        const ksaCustoms = trip.expenses.reduce((sum, exp) => sum + Number(exp.ksaCustoms || 0), 0);
        const mezan = trip.expenses.reduce((sum, exp) => sum + Number(exp.mezan || 0), 0);
        const jordanBorder = trip.expenses.reduce((sum, exp) => sum + Number(exp.jordanBorder || 0), 0);
        const cameraFine = trip.expenses.reduce((sum, exp) => sum + Number(exp.cameraFine || 0), 0);
        const hayaPeshgi = trip.expenses.reduce((sum, exp) => sum + Number(exp.hayaPeshgi || 0), 0);
        const toll = trip.expenses.reduce((sum, exp) => sum + Number(exp.toll || 0), 0); // Toll Gate
        const gatePass = trip.expenses.reduce((sum, exp) => sum + Number(exp.gatePass || 0), 0);
        const diesel = trip.expenses.reduce((sum, exp) => sum + Number(exp.diesel || 0), 0);
        const food = trip.expenses.reduce((sum, exp) => sum + Number(exp.food || 0), 0);
        const border = trip.expenses.reduce((sum, exp) => sum + Number(exp.border || 0), 0); // Broder
        const maintenance = trip.expenses.reduce((sum, exp) => sum + Number(exp.maintenance || 0), 0);

        // Calculate used petty cash (sum of all 15 categories)
        const usedPettyCash =
          qatarVisa +
          qatarToll +
          ksaVisa +
          uaeCustoms +
          ksaCustoms +
          mezan +
          jordanBorder +
          cameraFine +
          hayaPeshgi +
          toll +
          gatePass +
          diesel +
          food +
          border +
          maintenance;

        runningBalance += pettyCashIssued - usedPettyCash;

        return {
          tripId: trip.id,
          tripNumber: trip.tripNumber,
          date: trip.createdAt,
          truckNumber: trip.truck?.truckNumber || "N/A",
          truckPlate: trip.truck?.plateNumber || "N/A",
          doNumber: trip.doNumber || "N/A",
          clientName: trip.customer?.name || "N/A",
          loadingPoint: trip.loadingPoint || "N/A",
          deliveryPoint: trip.deliveryPoint || "N/A",
          // Granular expenses
          qatarVisa,
          qatarToll,
          ksaVisa,
          uaeCustoms,
          ksaCustoms,
          mezan,
          jordanBorder,
          cameraFine,
          hayaPeshgi,
          toll,
          gatePass,
          diesel,
          food,
          border,
          maintenance,
          // Totals
          pettyCashIssued,
          usedPettyCash,
          remainingBalance: runningBalance,
        };
      });

      // 4. Fetch all Salaries processed for this driver
      const salaries = await prisma.driverMonthlySalary.findMany({
        where: { driverId: id },
        orderBy: { createdAt: "asc" },
      });

      const salaryLedger = salaries.map((s) => {
        const [year, month] = s.salaryMonth.split("-").map(Number);
        const totalDeductions = Number(s.totalDeduction);

        return {
          id: s.id,
          date: s.createdAt,
          month,
          year,
          baseSalary: Number(s.basicSalary),
          roomDeduction: Number(s.roomRentDeduction),
          advanceDeduction: Number(s.advanceDeduction),
          fineDeduction: Number(s.trafficFineDeduction),
          visaDeduction: Number(s.visaDeduction),
          totalDeductions,
          netSalary: Number(s.netSalary),
          notes: s.notes || "",
          status: s.status,
        };
      });

      const formattedDriver = {
        ...driver,
        salary: Number(driver.salary),
        advanceBalance: Number(driver.advanceBalance),
        visaBalance: Number(driver.visaBalance),
      };

      return NextResponse.json({
        success: true,
        live: true,
        driver: formattedDriver,
        pettyCashLedger,
        salaryLedger,
      });
    } catch (dbError) {
      console.error("Ledger db fetch failed:", dbError);
      return NextResponse.json(
        { error: "Database error fetching ledger details." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Ledger API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
