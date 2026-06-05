import { createTrip, updateTrip } from "@/lib/operations";

function dateValue(value?: Date | string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export default function TripForm({ trip, customers, drivers, vehicles }: { trip?: any; customers: any[]; drivers: any[]; vehicles: any[] }) {
  const action = trip?.id ? updateTrip.bind(null, trip.id) : createTrip;
  const input = "rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";
  return (
    <form action={action} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
      <label className="grid gap-1 text-sm font-bold text-slate-700">Trip Date<input className={input} type="date" name="tripDate" defaultValue={dateValue(trip?.tripDate || trip?.createdAt)} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Status<select className={input} name="status" defaultValue={trip?.status || "OPEN"}>{["OPEN","ON_TRIP","COMPLETED","CLOSED","INVOICED","CANCELLED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Customer<select className={input} name="customerId" defaultValue={trip?.customerId || ""} required><option value="">Select customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.companyName || c.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Driver<select className={input} name="driverId" defaultValue={trip?.driverId || ""} required><option value="">Select driver</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Vehicle<select className={input} name="vehicleId" defaultValue={trip?.vehicleId || ""} required><option value="">Select vehicle</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.truckNo} - {v.plateNo}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">DO Number<input className={input} name="doNumber" defaultValue={trip?.doNumber || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">From Country<input className={input} name="fromCountry" defaultValue={trip?.fromCountry || "UAE"} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">To Country<input className={input} name="toCountry" defaultValue={trip?.toCountry || "Saudi Arabia"} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Loading Point<input className={input} name="loadingPoint" defaultValue={trip?.loadingPoint || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Delivery Point<input className={input} name="deliveryPoint" defaultValue={trip?.deliveryPoint || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Cargo Type<input className={input} name="cargoType" defaultValue={trip?.cargoType || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Cargo Weight<input className={input} type="number" step="0.01" name="cargoWeight" defaultValue={trip?.cargoWeight || 0} /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Trip Amount<input className={input} type="number" step="0.01" name="tripAmount" defaultValue={trip?.tripAmount || 0} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700 md:col-span-2">Notes<textarea className={input} name="notes" defaultValue={trip?.notes || ""} /></label>
      <div className="md:col-span-2"><button className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">Save Trip</button></div>
    </form>
  );
}
