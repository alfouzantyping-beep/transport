import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) notFound();
  const fields = ["mobile","passportNo","emiratesId","licenseNo","licenseExpiry","visaExpiry","basicSalary","advanceBalance","visaBalance","status"];
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black text-slate-950">{driver.name}</h1><p className="text-sm text-slate-500">Driver profile</p></div><Link className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white" href={`/drivers/${id}/edit`}>Edit</Link></div><div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">{fields.map((key) => <div key={key}><p className="text-xs font-bold uppercase text-slate-500">{key}</p><p className="mt-1 font-semibold text-slate-900">{(driver as any)[key] instanceof Date ? (driver as any)[key].toLocaleDateString() : String((driver as any)[key] ?? "")}</p></div>)}</div></div>;
}
