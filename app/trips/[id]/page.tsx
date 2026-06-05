import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

function money(v: number) { return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(v); }

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

function filledColumns(expense: Record<string, unknown>) {
  return excelColumns
    .map(([label, field]) => ({ label, amount: Number(expense[field] || 0) }))
    .filter((item) => item.amount > 0);
}

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      customer: true,
      driver: true,
      vehicle: true,
      cashAdvances: { orderBy: { cashDate: "desc" } },
      expenses: { include: { expenseCategory: true }, orderBy: { expenseDate: "desc" } },
      settlement: true,
      invoice: true,
    },
  });
  if (!trip) notFound();
  const totalCash = trip.cashAdvances.reduce((s, c) => s + Number(c.amount), 0);
  const totalExpenses = trip.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const balance = totalCash - totalExpenses;
  const result = balance > 0 ? "Driver must return amount to company" : balance < 0 ? "Company must pay driver" : "Settled";
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black text-slate-950">{trip.tripNo || trip.tripNumber}</h1><p className="text-sm text-slate-500">{trip.customer.companyName || trip.customer.name} - {trip.fromCountry} to {trip.toCountry}</p></div><div className="flex gap-2"><Link className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white" href={`/trips/${id}/edit`}>Edit</Link><Link className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white" href={`/trip-settlements/${id}`}>Settlement</Link></div></div>
      <div className="grid gap-4 md:grid-cols-4">{[["Trip Amount", money(Number(trip.tripAmount))],["Cash Given", money(totalCash)],["Expenses", money(totalExpenses)],["Balance", money(balance)]].map(([l,v]) => <div key={l} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">{l}</p><p className="mt-2 text-xl font-black text-slate-950">{v}</p></div>)}</div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black text-slate-950">Trip Information</h2><div className="mt-4 grid gap-3 text-sm md:grid-cols-2">{[["Date", trip.tripDate.toLocaleDateString()],["Driver", trip.driver.name],["Vehicle", trip.vehicle?.truckNo || "-"],["DO Number", trip.doNumber],["Cargo", `${trip.cargoType} (${trip.cargoWeight || 0})`],["Status", trip.status],["Invoice", trip.invoice?.status || "Not invoiced"],["Settlement", trip.settlement?.status || "Pending"]].map(([l,v]) => <div key={l}><p className="text-xs font-bold uppercase text-slate-500">{l}</p><p className="font-semibold text-slate-900">{v}</p></div>)}</div></section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black text-slate-950">Settlement Result</h2><p className="mt-3 text-2xl font-black text-slate-950">{money(Math.abs(balance))}</p><p className="mt-1 text-sm font-semibold text-slate-600">{result}</p><p className="mt-3 text-xs text-slate-500">Formula: total cash given - total expenses = settlement balance.</p></section>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4 font-black">Driver Cash Advances</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100">{trip.cashAdvances.map(c => <tr key={c.id}><td className="p-3">{c.cashDate.toLocaleDateString()}</td><td className="p-3">{c.paymentMethod}</td><td className="p-3">{c.givenBy}</td><td className="p-3 text-right font-black">{money(Number(c.amount))}</td></tr>)}</tbody></table></section>
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4 font-black">Trip Expenses</div><table className="w-full text-left text-sm"><tbody className="divide-y divide-slate-100">{trip.expenses.map(e => <tr key={e.id}><td className="p-3">{e.expenseDate.toLocaleDateString()}<div className="text-xs text-slate-500">{e.receiptNo || "-"}</div></td><td className="p-3"><div className="flex flex-wrap gap-1">{filledColumns(e).slice(0, 5).map(item => <span key={item.label} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{item.label}: {money(item.amount)}</span>)}</div></td><td className="p-3">{e.description || e.notes || "-"}</td><td className="p-3 text-right font-black">{money(Number(e.amount || 0))}</td></tr>)}</tbody></table></section>
    </div>
  );
}
