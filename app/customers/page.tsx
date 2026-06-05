import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const customers = await prisma.customer.findMany({
    where: q
      ? { OR: [{ companyName: { contains: q } }, { name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Customers</h1>
          <p className="text-sm font-medium text-slate-500">Customer master records, TRN, payment terms, and credit limits.</p>
        </div>
        <Link href="/customers/create" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Customer
        </Link>
      </div>
      <form className="flex max-w-xl items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input name="q" defaultValue={q} placeholder="Search company, phone, email" className="w-full bg-transparent text-sm outline-none" />
      </form>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr><th className="p-3">Company</th><th className="p-3">Contact</th><th className="p-3">Phone</th><th className="p-3">Terms</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900"><Link href={`/customers/${customer.id}`}>{customer.companyName || customer.name}</Link><div className="text-xs font-medium text-slate-500">{customer.email}</div></td>
                <td className="p-3 text-slate-600">{customer.contactPerson}</td>
                <td className="p-3 text-slate-600">{customer.phone}</td>
                <td className="p-3 text-slate-600">{customer.paymentTerms}</td>
                <td className="p-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{customer.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
