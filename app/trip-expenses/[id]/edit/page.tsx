import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ExpenseForm from "../../ExpenseForm";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [expense, trips] = await Promise.all([
    prisma.tripExpense.findUnique({ where: { id } }),
    prisma.trip.findMany({
      include: {
        customer: true,
        driver: true,
        vehicle: true,
        cashAdvances: { select: { amount: true } },
      },
      orderBy: { tripDate: "desc" },
    }),
  ]);
  if (!expense) notFound();
  const tripOptions = trips.map((trip) => ({
    ...trip,
    cashTotal: trip.cashAdvances.reduce((sum, cash) => sum + Number(cash.amount), 0),
  }));
  return <div className="space-y-5"><h1 className="text-2xl font-black text-slate-950">Edit Trip Expense</h1><ExpenseForm expense={expense} trips={tripOptions} /></div>;
}
