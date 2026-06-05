import { prisma } from "@/lib/db";
import ExpenseForm from "../ExpenseForm";

export default async function CreateExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const trips = await prisma.trip.findMany({
    include: {
      customer: true,
      driver: true,
      vehicle: true,
      cashAdvances: { select: { amount: true } },
    },
    orderBy: { tripDate: "desc" },
  });
  const tripOptions = trips.map((trip) => ({
    ...trip,
    cashTotal: trip.cashAdvances.reduce((sum, cash) => sum + Number(cash.amount), 0),
  }));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-950">Add Trip Expense</h1>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      <ExpenseForm trips={tripOptions} />
    </div>
  );
}
