import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeft, Wrench, Tag, Calendar, Shield, Gauge } from "lucide-react";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      currentDriver: true,
      maintenances: {
        orderBy: { maintenanceDate: "desc" }
      },
      vehicleExpenses: {
        include: {
          expenseCategory: true
        },
        orderBy: { expenseDate: "desc" }
      }
    }
  });

  if (!vehicle) notFound();

  // 1. Total Completed Maintenance Cost
  const totalCompletedMaintenance = vehicle.maintenances
    .filter(m => m.status === "COMPLETED")
    .reduce((sum, m) => sum + Number(m.amount), 0);

  // 2. Total Direct Vehicle Expenses
  const totalDirectExpenses = vehicle.vehicleExpenses
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // 3. Latest Odometer Reading (max value among completed/logged entries)
  const odometerReadings = vehicle.maintenances
    .map(m => m.odometer)
    .filter((o): o is number => o !== null);
  const latestOdometer = odometerReadings.length > 0 ? Math.max(...odometerReadings) : null;

  // 4. Next Service Date (latest scheduled service date)
  const serviceDates = vehicle.maintenances
    .map(m => m.nextServiceDate)
    .filter((d): d is Date => d !== null);
  const nextServiceDate = serviceDates.length > 0
    ? new Date(Math.max(...serviceDates.map(d => d.getTime())))
    : null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  const fields = [
    { label: "Truck Number", value: vehicle.truckNo },
    { label: "Plate Number", value: vehicle.plateNo },
    { label: "Trailer Number", value: vehicle.trailerNo || "N/A" },
    { label: "Vehicle Type", value: vehicle.vehicleType.replace("_", " ") },
    { label: "Model", value: vehicle.model || "N/A" },
    { label: "Owner Type", value: vehicle.ownerType.replace("_", " ") },
    { label: "Registration Expiry", value: vehicle.registrationExpiry.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
    { label: "Insurance Expiry", value: vehicle.insuranceExpiry.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
    { label: "Status", value: vehicle.status.replace("_", " "), isBadge: true }
  ];

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link href="/vehicles" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft className="h-4 w-4" /> Back to Vehicles
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Truck: {vehicle.truckNo}
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Assigned Driver: <span className="text-slate-800 font-bold">{vehicle.currentDriver?.name || "Unassigned"}</span>
          </p>
        </div>
        <Link className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-sm w-fit cursor-pointer" href={`/vehicles/${id}/edit`}>
          Edit Vehicle
        </Link>
      </div>

      {/* Aggregate Metrics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Completed Maintenance Cost */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Completed Maintenance</span>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(totalCompletedMaintenance)}</h3>
          </div>
        </div>

        {/* Direct Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Direct Expenses</span>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(totalDirectExpenses)}</h3>
          </div>
        </div>

        {/* Latest Odometer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Latest Odometer</span>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">
              {latestOdometer !== null ? `${latestOdometer.toLocaleString()} km` : "N/A"}
            </h3>
          </div>
        </div>

        {/* Next Service Date */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Next Service Date</span>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">
              {nextServiceDate ? nextServiceDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not Scheduled"}
            </h3>
          </div>
        </div>
      </div>

      {/* Core Specification */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-slate-500" /> Vehicle Specification
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {fields.map((field) => (
            <div key={field.label} className="border-b border-slate-100 pb-3 md:border-none md:pb-0">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{field.label}</p>
              {field.isBadge ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 mt-1 uppercase">
                  {field.value}
                </span>
              ) : (
                <p className="mt-1 text-xs font-bold text-slate-800">{String(field.value)}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns for Maintenance & Expense logs history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance History */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-emerald-600" /> Maintenance History
            </h2>
            <Link href="/maintenance/create" className="text-[11px] font-bold text-emerald-600 hover:underline">
              + Log New
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/20">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Odometer</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {vehicle.maintenances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No maintenance entries logged.
                    </td>
                  </tr>
                ) : (
                  vehicle.maintenances.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/40">
                      <td className="py-2.5 px-4 text-slate-650">
                        {new Date(m.maintenanceDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 font-bold">{m.maintenanceType}</td>
                      <td className="py-2.5 px-4 text-right text-slate-500 font-mono">
                        {m.odometer ? `${m.odometer.toLocaleString()} km` : "-"}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-900 font-black">{formatCurrency(m.amount)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${
                          m.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700"
                            : m.status === "PENDING"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-150 text-slate-500"
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense History */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-rose-600" /> Direct Expense History
            </h2>
            <Link href="/vehicle-expenses/create" className="text-[11px] font-bold text-rose-600 hover:underline">
              + Log New
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/20">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Ref No</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {vehicle.vehicleExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No direct expenses logged.
                    </td>
                  </tr>
                ) : (
                  vehicle.vehicleExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/40">
                      <td className="py-2.5 px-4 text-slate-650">
                        {new Date(e.expenseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                          {e.expenseCategory.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-550 font-mono">{e.referenceNo || "-"}</td>
                      <td className="py-2.5 px-4 text-right text-slate-900 font-black">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
