import { createDriver, updateDriver } from "@/lib/master-data";

function dateValue(value?: Date | string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export default function DriverForm({ driver }: { driver?: any }) {
  const action = driver?.id ? updateDriver.bind(null, driver.id) : createDriver;
  const input = "rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";
  return (
    <form action={action} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
      <label className="grid gap-1 text-sm font-bold text-slate-700">Name<input className={input} name="name" defaultValue={driver?.name || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Mobile<input className={input} name="mobile" defaultValue={driver?.mobile || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Passport No<input className={input} name="passportNo" defaultValue={driver?.passportNo || driver?.passport || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Emirates ID<input className={input} name="emiratesId" defaultValue={driver?.emiratesId || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">License No<input className={input} name="licenseNo" defaultValue={driver?.licenseNo || driver?.license || ""} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">License Expiry<input className={input} type="date" name="licenseExpiry" defaultValue={dateValue(driver?.licenseExpiry)} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Visa Expiry<input className={input} type="date" name="visaExpiry" defaultValue={dateValue(driver?.visaExpiry)} required /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Basic Salary<input className={input} type="number" step="0.01" name="basicSalary" defaultValue={driver?.basicSalary || driver?.salary || 0} /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Advance Balance<input className={input} type="number" step="0.01" name="advanceBalance" defaultValue={driver?.advanceBalance || 0} /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Visa Balance<input className={input} type="number" step="0.01" name="visaBalance" defaultValue={driver?.visaBalance || 0} /></label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">Status<select className={input} name="status" defaultValue={driver?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE"}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
      <div className="md:col-span-2"><button className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">Save Driver</button></div>
    </form>
  );
}
