import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, include: { currentDriver: true } });
  if (!vehicle) notFound();
  const fields = ["truckNo","plateNo","trailerNo","vehicleType","model","ownerType","registrationExpiry","insuranceExpiry","status"];
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black text-slate-950">{vehicle.truckNo}</h1><p className="text-sm text-slate-500">{vehicle.currentDriver?.name || "Unassigned"}</p></div><Link className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white" href={`/vehicles/${id}/edit`}>Edit</Link></div><div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">{fields.map((key) => <div key={key}><p className="text-xs font-bold uppercase text-slate-500">{key}</p><p className="mt-1 font-semibold text-slate-900">{(vehicle as any)[key] instanceof Date ? (vehicle as any)[key].toLocaleDateString() : String((vehicle as any)[key] ?? "")}</p></div>)}</div></div>;
}
