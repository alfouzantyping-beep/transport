import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";

const excelColumns = [
  ["QATAR VISA", "qatarVisa"],
  ["QATAR INS", "qatarToll"],
  ["KSA VISA", "ksaVisa"],
  ["UAE CUSTOM", "uaeCustoms"],
  ["KSA CUSTOM", "ksaCustoms"],
  ["MEZAN", "mezan"],
  ["JORAN OUT", "jordanBorder"],
  ["CAMRA X", "cameraFine"],
  ["HAYA/PESHA", "hayaPeshgi"],
  ["TOLL GATE", "toll"],
  ["GATE PASS", "gatePass"],
  ["DIESEL", "diesel"],
  ["FOOD", "food"],
  ["BRODER", "border"],
  ["MAINTEANCE", "maintenance"],
] as const;

function money(v: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(v);
}

function filledColumns(expense: Record<string, unknown>) {
  return excelColumns
    .map(([label, field]) => ({ label, amount: Number(expense[field] || 0) }))
    .filter((item) => item.amount > 0);
}

export default async function TripExpensesPage() {
  const expenses = await prisma.tripExpense.findMany({
    include: { trip: true, driver: true, vehicle: true },
    orderBy: { expenseDate: "desc" },
  });
  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const pettyCash = expenses.reduce((s, e) => s + Number(e.pettyCash || 0), 0);
  const remaining = expenses.reduce((s, e) => s + Number(e.remainingBalance || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Trip Expenses</h1>
          <p className="text-sm text-slate-500">Excel-style petty cash rows for driver receipts.</p>
        </div>
        <Link href="/trip-expenses/create" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
          <Plus className="h-4 w-4" /> Add Expense
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">USED PETTY CASH</p>
          <p className="mt-2 text-2xl font-black">{money(total)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">PETTY CASH</p>
          <p className="mt-2 text-2xl font-black">{money(pettyCash)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">REMNING BAL</p>
          <p className="mt-2 text-2xl font-black">{money(remaining)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Rows</p>
          <p className="mt-2 text-2xl font-black">{expenses.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">DATE / TRIP</th>
              <th className="p-3">DRIVER / TRUCK</th>
              <th className="p-3">Filled Excel Columns</th>
              <th className="p-3 text-right">USED PETTY CASH</th>
              <th className="p-3 text-right">REMNING BAL</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => {
              const columns = filledColumns(expense);
              return (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">
                    {expense.expenseDate.toLocaleDateString()}
                    <div className="text-xs text-slate-500">{expense.trip.tripNo || expense.trip.tripNumber}</div>
                  </td>
                  <td className="p-3">
                    {expense.driver?.name || "-"}
                    <div className="text-xs text-slate-500">{expense.vehicle?.truckNo || "-"}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {columns.length ? columns.slice(0, 6).map((item) => (
                        <span key={item.label} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">
                          {item.label}: {money(item.amount)}
                        </span>
                      )) : <span className="text-slate-400">-</span>}
                      {columns.length > 6 && <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">+{columns.length - 6}</span>}
                    </div>
                  </td>
                  <td className="p-3 text-right font-black">{money(Number(expense.amount || 0))}</td>
                  <td className="p-3 text-right font-black">{money(Number(expense.remainingBalance || 0))}</td>
                  <td className="p-3"><Link className="text-xs font-bold text-emerald-700" href={`/trip-expenses/${expense.id}/edit`}>Edit</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
