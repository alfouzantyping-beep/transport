import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";

export default async function DriversPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const drivers = await prisma.driver.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { mobile: { contains: q } }, { passportNo: { contains: q } }, { passport: { contains: q } }, { emiratesId: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black text-slate-950">Drivers</h1><p className="text-sm text-slate-500">Driver profiles, salary, balances, and expiry dates.</p></div><Link href="/drivers/create" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Add Driver</Link></div>
      <form className="flex max-w-xl items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"><Search className="h-4 w-4 text-slate-400" /><input name="q" defaultValue={q} placeholder="Search name, mobile, passport, Emirates ID" className="w-full bg-transparent text-sm outline-none" /></form>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="p-3">Driver</th><th className="p-3">Passport</th><th className="p-3">License Expiry</th><th className="p-3">Visa Expiry</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{drivers.map((driver) => <tr key={driver.id} className="hover:bg-slate-50"><td className="p-3 font-bold"><Link href={`/drivers/${driver.id}`}>{driver.name}</Link><div className="text-xs font-medium text-slate-500">{driver.mobile}</div></td><td className="p-3">{driver.passportNo || driver.passport}</td><td className="p-3">{driver.licenseExpiry ? driver.licenseExpiry.toLocaleDateString() : "-"}</td><td className="p-3">{driver.visaExpiry ? driver.visaExpiry.toLocaleDateString() : "-"}</td><td className="p-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{driver.status}</span></td></tr>)}</tbody></table></div>
    </div>
  );
}
