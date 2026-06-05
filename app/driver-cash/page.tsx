import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";

function money(v: number) { return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(v); }

export default async function DriverCashPage() {
  const advances = await prisma.driverCashAdvance.findMany({ include: { trip: true, driver: true }, orderBy: { cashDate: "desc" } });
  const totals = new Map<string, number>();
  for (const cash of advances) totals.set(cash.tripId, (totals.get(cash.tripId) || 0) + Number(cash.amount));
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black text-slate-950">Driver Cash</h1><p className="text-sm text-slate-500">Cash advances issued against trips.</p></div><Link href="/driver-cash/create" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Add Cash</Link></div><div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="p-3">Trip</th><th className="p-3">Driver</th><th className="p-3">Date</th><th className="p-3">Method</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">Trip Total</th></tr></thead><tbody className="divide-y divide-slate-100">{advances.map(c => <tr key={c.id} className="hover:bg-slate-50"><td className="p-3 font-bold"><Link href={`/driver-cash/${c.id}`}>{c.trip.tripNo || c.trip.tripNumber}</Link></td><td className="p-3">{c.driver.name}</td><td className="p-3">{c.cashDate.toLocaleDateString()}</td><td className="p-3">{c.paymentMethod.replace("_"," ")}</td><td className="p-3 text-right font-black">{money(Number(c.amount))}</td><td className="p-3 text-right font-black">{money(totals.get(c.tripId) || 0)}</td></tr>)}</tbody></table></div></div>;
}
