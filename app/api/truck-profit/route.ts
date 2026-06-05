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
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const vehicleId = searchParams.get("vehicleId");
    const driverId = searchParams.get("driverId");
    const customerId = searchParams.get("customerId");

    // Parsed dates if available
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    // Get vehicles we need to calculate profit for
    const vehicleWhere: any = {};
    if (vehicleId) {
      vehicleWhere.id = vehicleId;
    }

    const vehicles = await prisma.vehicle.findMany({
      where: vehicleWhere,
      orderBy: { truckNo: "asc" }
    });

    const report = await Promise.all(
      vehicles.map(async (vehicle) => {
        // 1. Trip Revenue (filtered by tripDate, driverId, customerId, and date range)
        const tripWhere: any = {
          vehicleId: vehicle.id
        };
        if (driverId) tripWhere.driverId = driverId;
        if (customerId) tripWhere.customerId = customerId;
        if (startDate || endDate) {
          tripWhere.tripDate = {};
          if (startDate) tripWhere.tripDate.gte = startDate;
          if (endDate) tripWhere.tripDate.lte = endDate;
        }

        const trips = await prisma.trip.findMany({
          where: tripWhere,
          select: { tripAmount: true }
        });
        const totalTrips = trips.length;
        const revenue = trips.reduce((sum, t) => sum + Number(t.tripAmount || 0), 0);

        // 2. Trip Expenses (filtered by expenseDate date range, and driverId if specified)
        const tripExpenseWhere: any = {
          vehicleId: vehicle.id
        };
        if (driverId) tripExpenseWhere.driverId = driverId;
        if (startDate || endDate) {
          tripExpenseWhere.expenseDate = {};
          if (startDate) tripExpenseWhere.expenseDate.gte = startDate;
          if (endDate) tripExpenseWhere.expenseDate.lte = endDate;
        }

        const tripExpensesList = await prisma.tripExpense.findMany({
          where: tripExpenseWhere
        });

        // Helper function to sum trip expense fields
        const sumTripExpenses = (expenses: any[]) => {
          const keys = [
            "diesel", "petrol", "toll", "border", "visa", "customs", "food",
            "parking", "maintenance", "hotel", "other", "qatarVisa", "qatarToll",
            "ksaVisa", "uaeCustoms", "ksaCustoms", "mezan", "jordanBorder",
            "cameraFine", "hayaPeshgi", "gatePass"
          ];
          return expenses.reduce((total, exp) => {
            return total + keys.reduce((sum, key) => sum + Number(exp[key] || 0), 0);
          }, 0);
        };

        const tripExpenses = sumTripExpenses(tripExpensesList);

        // 3. Direct Vehicle Expenses (filtered by expenseDate date range)
        const vehicleExpenseWhere: any = {
          vehicleId: vehicle.id
        };
        if (startDate || endDate) {
          vehicleExpenseWhere.expenseDate = {};
          if (startDate) vehicleExpenseWhere.expenseDate.gte = startDate;
          if (endDate) vehicleExpenseWhere.expenseDate.lte = endDate;
        }

        const vehicleExpensesList = await prisma.vehicleExpense.findMany({
          where: vehicleExpenseWhere,
          select: { amount: true }
        });
        const vehicleExpenses = vehicleExpensesList.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

        // 4. Vehicle Maintenance (filtered by status === COMPLETED and maintenanceDate date range)
        const maintenanceWhere: any = {
          vehicleId: vehicle.id,
          status: "COMPLETED"
        };
        if (startDate || endDate) {
          maintenanceWhere.maintenanceDate = {};
          if (startDate) maintenanceWhere.maintenanceDate.gte = startDate;
          if (endDate) maintenanceWhere.maintenanceDate.lte = endDate;
        }

        const maintenanceList = await prisma.vehicleMaintenance.findMany({
          where: maintenanceWhere,
          select: { amount: true }
        });
        const maintenanceCost = maintenanceList.reduce((sum, maint) => sum + Number(maint.amount || 0), 0);

        // 5. Calculate Profit
        const netProfit = revenue - tripExpenses - vehicleExpenses - maintenanceCost;

        return {
          id: vehicle.id,
          truckNo: vehicle.truckNo,
          plateNo: vehicle.plateNo,
          totalTrips,
          revenue,
          tripExpenses,
          vehicleExpenses,
          maintenanceCost,
          netProfit
        };
      })
    );

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("GET Truck Profit error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
