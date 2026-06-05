import { prisma } from "@/lib/db";

export type LedgerResultType = "DRIVER_OWES_COMPANY" | "COMPANY_OWES_DRIVER" | "SETTLED";

export type DriverLedgerTrip = {
  tripId: string;
  tripNo: string;
  tripDate: Date;
  truckNo: string;
  customer: string;
  from: string;
  to: string;
  cashGiven: number;
  totalExpenses: number;
  settlementBalance: number;
  resultType: LedgerResultType;
  message: string;
  settlementStatus: string;
};

export type DriverLedgerSummary = {
  driverId: string;
  driverName: string;
  totalTrips: number;
  totalCashGiven: number;
  totalExpenses: number;
  totalDriverOwesCompany: number;
  totalCompanyOwesDriver: number;
  finalBalance: number;
};

function getResultType(balance: number): LedgerResultType {
  if (balance > 0) return "DRIVER_OWES_COMPANY";
  if (balance < 0) return "COMPANY_OWES_DRIVER";
  return "SETTLED";
}

export function getLedgerMessage(resultType: LedgerResultType) {
  if (resultType === "DRIVER_OWES_COMPANY") return "Driver must return money to company";
  if (resultType === "COMPANY_OWES_DRIVER") return "Company must pay driver";
  return "Settled";
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date) {
  return value.toLocaleDateString("en-AE");
}

export async function getDriverLedgerTrips(driverId?: string): Promise<DriverLedgerTrip[]> {
  const trips = await prisma.trip.findMany({
    where: driverId ? { driverId } : undefined,
    include: {
      customer: true,
      truck: true,
      cashAdvances: true,
      expenses: true,
      settlement: true,
    },
    orderBy: { tripDate: "desc" },
  });

  return trips.map((trip) => {
    const cashGiven = trip.cashAdvances.reduce((sum, cash) => sum + Number(cash.amount || 0), 0);
    const totalExpenses = trip.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const settlementBalance = cashGiven - totalExpenses;
    const resultType = getResultType(settlementBalance);

    return {
      tripId: trip.id,
      tripNo: trip.tripNo || trip.tripNumber,
      tripDate: trip.tripDate,
      truckNo: trip.truck.truckNumber,
      customer: trip.customer.companyName || trip.customer.name,
      from: trip.loadingPoint || trip.fromCountry,
      to: trip.deliveryPoint || trip.toCountry,
      cashGiven,
      totalExpenses,
      settlementBalance,
      resultType,
      message: getLedgerMessage(resultType),
      settlementStatus: trip.settlement?.status || "PENDING",
    };
  });
}

export function summarizeLedgerTrips(
  driverId: string,
  driverName: string,
  trips: DriverLedgerTrip[]
): DriverLedgerSummary {
  const totalCashGiven = trips.reduce((sum, trip) => sum + trip.cashGiven, 0);
  const totalExpenses = trips.reduce((sum, trip) => sum + trip.totalExpenses, 0);
  const outstandingTrips = trips.filter((trip) => trip.settlementStatus !== "SETTLED");
  const totalDriverOwesCompany = outstandingTrips.reduce(
    (sum, trip) => sum + Math.max(trip.settlementBalance, 0),
    0
  );
  const totalCompanyOwesDriver = outstandingTrips.reduce(
    (sum, trip) => sum + Math.abs(Math.min(trip.settlementBalance, 0)),
    0
  );

  return {
    driverId,
    driverName,
    totalTrips: trips.length,
    totalCashGiven,
    totalExpenses,
    totalDriverOwesCompany,
    totalCompanyOwesDriver,
    finalBalance: totalDriverOwesCompany - totalCompanyOwesDriver,
  };
}

export async function getDriverLedgerSummaries(): Promise<DriverLedgerSummary[]> {
  const drivers = await prisma.driver.findMany({
    include: {
      trips: {
        include: {
          customer: true,
          truck: true,
          cashAdvances: true,
          expenses: true,
          settlement: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return drivers.map((driver) => {
    const trips = driver.trips.map((trip) => {
      const cashGiven = trip.cashAdvances.reduce((sum, cash) => sum + Number(cash.amount || 0), 0);
      const totalExpenses = trip.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      const settlementBalance = cashGiven - totalExpenses;
      const resultType = getResultType(settlementBalance);

      return {
        tripId: trip.id,
        tripNo: trip.tripNo || trip.tripNumber,
        tripDate: trip.tripDate,
        truckNo: trip.truck.truckNumber,
        customer: trip.customer.companyName || trip.customer.name,
        from: trip.loadingPoint || trip.fromCountry,
        to: trip.deliveryPoint || trip.toCountry,
        cashGiven,
        totalExpenses,
        settlementBalance,
        resultType,
        message: getLedgerMessage(resultType),
        settlementStatus: trip.settlement?.status || "PENDING",
      };
    });

    return summarizeLedgerTrips(driver.id, driver.name, trips);
  });
}
