import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const vehicles = await prisma.vehicle.findMany({
    where: q ? { OR: [{ truckNo: { contains: q } }, { plateNo: { contains: q } }, { trailerNo: { contains: q } }] } : undefined,
    include: { currentDriver: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return <div className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black text-slate-950">Vehicles</h1><p className="text-sm text-slate-500">Trucks, trailers, owner type, expiries, and assigned drivers.</p></div><Link href="/vehicles/create" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Add Vehicle</Link></div><form className="flex max-w-xl items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"><Search className="h-4 w-4 text-slate-400" /><input name="q" defaultValue={q} placeholder="Search truck, plate, trailer number" className="w-full bg-transparent text-sm outline-none" /></form><div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="p-3">Vehicle</th><th className="p-3">Type</th><th className="p-3">Driver</th><th className="p-3">Registration</th><th className="p-3">Insurance</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{vehicles.map((vehicle) => <tr key={vehicle.id} className="hover:bg-slate-50"><td className="p-3 font-bold"><Link href={`/vehicles/${vehicle.id}`}>{vehicle.truckNo}</Link><div className="text-xs font-medium text-slate-500">{vehicle.plateNo}</div></td><td className="p-3">{vehicle.vehicleType.replace("_", " ")}</td><td className="p-3">{vehicle.currentDriver?.name || "Unassigned"}</td><td className="p-3">{vehicle.registrationExpiry.toLocaleDateString()}</td><td className="p-3">{vehicle.insuranceExpiry.toLocaleDateString()}</td><td className="p-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{vehicle.status.replace("_", " ")}</span></td></tr>)}</tbody></table></div></div>;
}
