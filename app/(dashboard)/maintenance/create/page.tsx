"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench, RefreshCw, Calendar, FileText, User } from "lucide-react";

interface Vehicle {
  id: string;
  truckNo: string;
}

export default function CreateMaintenancePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [vehicleId, setVehicleId] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [maintenanceType, setMaintenanceType] = useState("Oil Change");
  const [workshopName, setWorkshopName] = useState("");
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [description, setDescription] = useState("");
  const [invoiceImageUrl, setInvoiceImageUrl] = useState("");
  const [status, setStatus] = useState("COMPLETED");

  const maintenanceTypes = [
    "Oil Change", "Tyre", "Battery", "Engine Repair", "Brake Repair", "AC Repair",
    "Service", "Washing", "Accident Repair", "Passing", "Renewal", "Insurance", "Other"
  ];

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/vehicles");
        if (!res.ok) throw new Error("Failed to fetch vehicles");
        const data = await res.json();
        setVehicles(data);
      } catch (err) {
        console.error(err);
        setError("Could not load vehicle list.");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation checks
    if (!vehicleId) {
      setError("Vehicle is required.");
      return;
    }
    if (!maintenanceDate) {
      setError("Maintenance date is required.");
      return;
    }
    if (!maintenanceType) {
      setError("Maintenance type is required.");
      return;
    }
    if (!workshopName.trim()) {
      setError("Workshop name is required.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    let parsedOdometer: number | null = null;
    if (odometer.trim() !== "") {
      parsedOdometer = Number(odometer);
      if (isNaN(parsedOdometer) || !Number.isInteger(parsedOdometer) || parsedOdometer < 0) {
        setError("Odometer must be a positive integer if entered.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          maintenanceDate,
          maintenanceType,
          workshopName,
          amount: parsedAmount,
          odometer: parsedOdometer,
          nextServiceDate: nextServiceDate || null,
          description,
          invoiceImageUrl,
          status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log maintenance record");

      router.push("/maintenance");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while logging maintenance details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/maintenance"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Maintenance List
        </Link>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Log Vehicle Maintenance</h1>
              <p className="text-[10px] text-slate-350 font-semibold mt-0.5">
                Record workshop repairs, general services, inspections, and schedule future service mileage.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold">
                {error}
              </div>
            )}

            {/* Vehicle Selection */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Select Vehicle / Truck *
              </label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 px-3.5 py-3 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              >
                <option value="">-- Choose Truck --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.truckNo}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Maintenance Date *
                </label>
                <input
                  type="date"
                  required
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Maintenance Type *
                </label>
                <select
                  required
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer"
                >
                  {maintenanceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Workshop and Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Workshop Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Futtaim Auto Center"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Maintenance Amount (AED) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="e.g. 1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>
            </div>

            {/* Odometer and Next Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Odometer Reading (KM)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 152000"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Next Service Date (Recommended)
                </label>
                <input
                  type="date"
                  value={nextServiceDate}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>
            </div>

            {/* Status and Invoice Image Url */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Service / Work Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer"
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending (Scheduled)</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Invoice Image URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. /uploads/maint-123.jpg"
                  value={invoiceImageUrl}
                  onChange={(e) => setInvoiceImageUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Repairs Description / Notes
              </label>
              <textarea
                rows={3}
                placeholder="List work details, replacements, filter changes, mechanic notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <Link
                href="/maintenance"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Logging..." : "Log Details"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
