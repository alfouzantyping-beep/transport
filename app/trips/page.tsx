import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";

function money(v: number) { return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(v); }

export default async function TripsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  const trips = await prisma.trip.findMany({
    where: {
      ...(p.status ? { status: p.status as any } : {}),
      ...(p.country ? { OR: [{ fromCountry: { contains: p.country } }, { toCountry: { contains: p.country } }] } : {}),
      ...(p.customerId ? { customerId: p.customerId } : {}),
      ...(p.driverId ? { driverId: p.driverId } : {}),
      ...(p.vehicleId ? { vehicleId: p.vehicleId } : {}),
      ...(p.date ? { tripDate: { gte: new Date(`${p.date}T00:00:00`), lte: new Date(`${p.date}T23:59:59`) } } : {}),
    },
    include: { customer: true, driver: true, vehicle: true },
    orderBy: { tripDate: "desc" },
  });
  const [customers, drivers, vehicles] = await Promise.all([
    prisma.customer.findMany({ orderBy: { companyName: "asc" } }),
    prisma.driver.findMany({ orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ orderBy: { truckNo: "asc" } }),
  ]);
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black text-slate-950">Trips</h1><p className="text-sm text-slate-500">Create, filter, and monitor transport trips.</p></div><Link href="/trips/create" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Create Trip</Link></div>
      <form className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-6">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3"><Search className="h-4 w-4 text-slate-400" /><input name="country" defaultValue={p.country || ""} placeholder="Country" className="w-full py-2 text-sm outline-none" /></div>
        <input type="date" name="date" defaultValue={p.date || ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        <select name="customerId" defaultValue={p.customerId || ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">All customers</option>{customers.map(c => <option key={c.id} value={c.id}>{c.companyName || c.name}</option>)}</select>
        <select name="driverId" defaultValue={p.driverId || ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">All drivers</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select name="vehicleId" defaultValue={p.vehicleId || ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">All vehicles</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.truckNo}</option>)}</select>
        <select name="status" defaultValue={p.status || ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">All status</option>{["OPEN","ON_TRIP","COMPLETED","CLOSED","INVOICED","CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}</select>
      </form>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="p-3">Trip</th><th className="p-3">Customer</th><th className="p-3">Driver / Vehicle</th><th className="p-3">Route</th><th className="p-3 text-right">Amount</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{trips.map(t => <tr key={t.id} className="hover:bg-slate-50"><td className="p-3 font-black"><Link href={`/trips/${t.id}`}>{t.tripNo || t.tripNumber}</Link><div className="text-xs font-medium text-slate-500">{t.tripDate.toLocaleDateString()}</div></td><td className="p-3">{t.customer.companyName || t.customer.name}</td><td className="p-3">{t.driver.name}<div className="text-xs text-slate-500">{t.vehicle?.truckNo || "-"}</div></td><td className="p-3">{t.fromCountry} {"->"} {t.toCountry}</td><td className="p-3 text-right font-black">{money(Number(t.tripAmount))}</td><td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{t.status.replace("_"," ")}</span></td></tr>)}</tbody></table></div>
    </div>
  );
}
