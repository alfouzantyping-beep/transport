import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-black text-slate-950">{customer.companyName || customer.name}</h1><p className="text-sm text-slate-500">{customer.contactPerson}</p></div><Link className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white" href={`/customers/${id}/edit`}>Edit</Link></div>
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        {["phone","email","trn","paymentTerms","creditLimit","status","address"].map((key) => <div key={key}><p className="text-xs font-bold uppercase text-slate-500">{key}</p><p className="mt-1 font-semibold text-slate-900">{String((customer as any)[key] ?? "")}</p></div>)}
      </div>
    </div>
  );
}
