import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { markSettlementSettled } from "@/lib/operations";

function money(v: number) { return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(v); }

export default async function CloseSettlementPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { driver: true, cashAdvances: true, expenses: true } });
  if (!trip) notFound();
  const cash = trip.cashAdvances.reduce((s,c)=>s+Number(c.amount),0);
  const exp = trip.expenses.reduce((s,e)=>s+Number(e.amount || 0),0);
  const bal = cash - exp;
  return <div className="space-y-5"><h1 className="text-2xl font-black text-slate-950">Close Settlement</h1><div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Confirm settlement for <b>{trip.tripNo || trip.tripNumber}</b>. Marking settled will update trip status to CLOSED.</p><div className="mt-5 grid gap-4 md:grid-cols-3"><div><p className="text-xs font-bold uppercase text-slate-500">Cash</p><p className="text-xl font-black">{money(cash)}</p></div><div><p className="text-xs font-bold uppercase text-slate-500">Expenses</p><p className="text-xl font-black">{money(exp)}</p></div><div><p className="text-xs font-bold uppercase text-slate-500">Balance</p><p className="text-xl font-black">{money(bal)}</p></div></div><form action={markSettlementSettled} className="mt-5"><input type="hidden" name="tripId" value={tripId} /><textarea name="notes" className="w-full rounded-lg border border-slate-200 p-3 text-sm" placeholder="Final settlement notes" /><button className="mt-3 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white">Mark as Settled and Close Trip</button></form></div></div>;
}
