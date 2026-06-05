import { createCustomer, updateCustomer } from "@/lib/master-data";

export default function CustomerForm({ customer }: { customer?: any }) {
  const action = customer?.id ? updateCustomer.bind(null, customer.id) : createCustomer;
  const input = "rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";
  return (
    <form action={action} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
      <label className="grid gap-1 text-sm font-bold text-slate-700">Company Name<input className={input} name="companyName" defaultValue={customer?.companyName || customer?.name || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Contact Person<input className={input} name="contactPerson" defaultValue={customer?.contactPerson || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Phone<input className={input} name="phone" defaultValue={customer?.phone || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Email<input className={input} type="email" name="email" defaultValue={customer?.email || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">TRN<input className={input} name="trn" defaultValue={customer?.trn || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Payment Terms<input className={input} name="paymentTerms" defaultValue={customer?.paymentTerms || "Net 30"} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Credit Limit<input className={input} type="number" step="0.01" name="creditLimit" defaultValue={customer?.creditLimit || 0} /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Status<select className={input} name="status" defaultValue={customer?.status || "ACTIVE"}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700 md:col-span-2">Address<textarea className={input} name="address" defaultValue={customer?.address || ""} required /></label>
      <div className="md:col-span-2"><button className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">Save Customer</button></div>
    </form>
  );
}
