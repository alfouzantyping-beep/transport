import { createCashAdvance } from "@/lib/operations";

export default function CashForm({ trips }: { trips: any[] }) {
  const input = "rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";
  return (
    <form action={createCashAdvance} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
      <label className="grid gap-1 text-sm font-bold text-slate-700">Trip<select className={input} name="tripId" required><option value="">Select trip</option>{trips.map(t => <option key={t.id} value={t.id}>{t.tripNo || t.tripNumber} - {t.driver.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Cash Date<input className={input} type="date" name="cashDate" defaultValue={new Date().toISOString().slice(0,10)} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Amount<input className={input} type="number" step="0.01" name="amount" required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Payment Method<select className={input} name="paymentMethod" defaultValue="CASH"><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank Transfer</option><option value="CARD">Card</option><option value="OTHER">Other</option></select></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Given By<input className={input} name="givenBy" defaultValue="Admin" required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700 md:col-span-2">Notes<textarea className={input} name="notes" /></label>
      <div className="md:col-span-2"><button className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white">Save Cash Advance</button></div>
    </form>
  );
}
