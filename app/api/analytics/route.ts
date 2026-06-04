import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // 1. Try to fetch live metrics from database
      const totalTrips = await prisma.trip.count();
      const activeTrips = await prisma.trip.count({
        where: { status: { in: ["LOADING", "IN_TRANSIT"] } },
      });
      const completedTrips = await prisma.trip.count({
        where: { status: "DELIVERED" },
      });

      const totalDrivers = await prisma.driver.count();
      const availableDrivers = await prisma.driver.count({
        where: { status: "AVAILABLE" },
      });

      const totalTrucks = await prisma.truck.count();
      const availableTrucks = await prisma.truck.count({
        where: { status: "AVAILABLE" },
      });

      const trips = await prisma.trip.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          driver: { select: { name: true } },
          truck: { select: { truckNumber: true } },
        },
      });

      const rawRevenue = await prisma.trip.aggregate({
        _sum: { tripAmount: true },
      });
      const totalRevenue = Number(rawRevenue._sum.tripAmount || 0);

      // Sum all trip expenses
      const rawExpenses = await prisma.tripExpense.aggregate({
        _sum: {
          diesel: true,
          petrol: true,
          toll: true,
          border: true,
          visa: true,
          customs: true,
          food: true,
          parking: true,
          maintenance: true,
          hotel: true,
          other: true,
        },
      });
      const totalExpensesSum = 
        Number(rawExpenses._sum.diesel || 0) +
        Number(rawExpenses._sum.petrol || 0) +
        Number(rawExpenses._sum.toll || 0) +
        Number(rawExpenses._sum.border || 0) +
        Number(rawExpenses._sum.visa || 0) +
        Number(rawExpenses._sum.customs || 0) +
        Number(rawExpenses._sum.food || 0) +
        Number(rawExpenses._sum.parking || 0) +
        Number(rawExpenses._sum.maintenance || 0) +
        Number(rawExpenses._sum.hotel || 0) +
        Number(rawExpenses._sum.other || 0);

      const netProfit = totalRevenue - totalExpensesSum;

      // Mock country trip volume distribution
      const countryVolume = [
        { name: "Saudi Arabia", value: 35 },
        { name: "UAE", value: 25 },
        { name: "Oman", value: 15 },
        { name: "Qatar", value: 15 },
        { name: "Kuwait", value: 10 },
      ];

      return NextResponse.json({
        live: true,
        stats: {
          totalTrips,
          activeTrips,
          completedTrips,
          fleetUtilization: totalTrucks > 0 ? Math.round(((totalTrucks - availableTrucks) / totalTrucks) * 100) : 0,
          totalRevenue,
          totalExpenses: totalExpensesSum,
          netProfit,
          driversCount: totalDrivers,
          availableDrivers,
          trucksCount: totalTrucks,
          availableTrucks,
        },
        recentTrips: trips.map(t => ({
          id: t.id,
          tripNumber: t.tripNumber,
          customer: t.customer.name,
          driver: t.driver.name,
          truck: t.truck.truckNumber,
          route: `${t.fromCountry} ➔ ${t.toCountry}`,
          amount: Number(t.tripAmount),
          status: t.status,
        })),
        countryVolume,
      });
    } catch (dbError) {
      console.warn("Database connection failed. Falling back to default mock analytics data.", dbError);

      // 2. Return high-fidelity mockup data if DB is offline
      const mockStats = {
        totalTrips: 186,
        activeTrips: 24,
        completedTrips: 158,
        fleetUtilization: 82,
        totalRevenue: 284500.00,
        totalExpenses: 114200.00,
        netProfit: 170300.00,
        driversCount: 22,
        availableDrivers: 6,
        trucksCount: 20,
        availableTrucks: 4,
      };

      const mockRecentTrips = [
        {
          id: "1",
          tripNumber: "TRIP-2026-001",
          customer: "Almarai Company",
          driver: "Muhammad Khan",
          truck: "TRK-01-SHJ",
          route: "UAE ➔ Saudi Arabia",
          amount: 8500.00,
          status: "IN_TRANSIT",
        },
        {
          id: "2",
          tripNumber: "TRIP-2026-002",
          customer: "Emaar Properties PJSC",
          driver: "Amrit Singh",
          truck: "TRK-02-DXB",
          route: "UAE ➔ Oman",
          amount: 4200.00,
          status: "LOADING",
        },
        {
          id: "3",
          tripNumber: "TRIP-2026-003",
          customer: "Kuwait Petroleum Corporation",
          driver: "Fahad Al-Sabah",
          truck: "TRK-01-SHJ",
          route: "Kuwait ➔ UAE",
          amount: 12500.00,
          status: "DELIVERED",
        },
        {
          id: "4",
          tripNumber: "TRIP-2026-004",
          customer: "Qatar Gas",
          driver: "Sajid Khan",
          truck: "TRK-02-DXB",
          route: "Qatar ➔ Saudi Arabia",
          amount: 9800.00,
          status: "DELIVERED",
        },
      ];

      const mockCountryVolume = [
        { name: "Saudi Arabia", value: 45 },
        { name: "UAE", value: 30 },
        { name: "Oman", value: 12 },
        { name: "Qatar", value: 8 },
        { name: "Kuwait", value: 5 },
      ];

      return NextResponse.json({
        live: false,
        stats: mockStats,
        recentTrips: mockRecentTrips,
        countryVolume: mockCountryVolume,
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
