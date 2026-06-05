import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { calculateSettlement } from "@/lib/operations";

function money(v: number) { return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(v); }

export default async function SettlementDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { driver: true, customer: true, cashAdvances: true, expenses: true, settlement: true } });
  if (!trip) notFound();
  const cash = trip.cashAdvances.reduce((s,c)=>s+Number(c.amount),0);
  const exp = trip.expenses.reduce((s,e)=>s+Number(e.amount || 0),0);
  const bal = cash - exp;
  const result = bal > 0 ? "DRIVER_OWES_COMPANY" : bal < 0 ? "COMPANY_OWES_DRIVER" : "SETTLED";
  const message = bal > 0 ? "Driver must return amount to company" : bal < 0 ? "Company must pay driver" : "No balance remains";
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black text-slate-950">Settlement - {trip.tripNo || trip.tripNumber}</h1><p className="text-sm text-slate-500">{trip.driver.name} / {trip.customer.companyName || trip.customer.name}</p></div><Link className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white" href={`/trip-settlements/${tripId}/close`}>Close Trip</Link></div><div className="grid gap-4 md:grid-cols-4">{[["Cash Given", cash],["Total Expenses", exp],["Balance", bal],["Trip Amount", Number(trip.tripAmount)]].map(([l,v]) => <div key={String(l)} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">{l}</p><p className="mt-2 text-2xl font-black">{money(Number(v))}</p></div>)}</div><section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Result</p><h2 className="mt-2 text-2xl font-black text-slate-950">{result.replaceAll("_"," ")}</h2><p className="mt-1 text-sm font-semibold text-slate-600">{message}: {money(Math.abs(bal))}</p><form action={calculateSettlement} className="mt-4"><input type="hidden" name="tripId" value={tripId} /><textarea name="notes" className="w-full rounded-lg border border-slate-200 p-3 text-sm" placeholder="Settlement notes" defaultValue={trip.settlement?.notes || ""} /><button className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">Recalculate Settlement</button></form></section></div>;
}
