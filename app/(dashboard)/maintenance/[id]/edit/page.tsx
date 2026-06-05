"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench, RefreshCw, Edit3 } from "lucide-react";

interface Vehicle {
  id: string;
  truckNo: string;
}

interface Maintenance {
  id: string;
  vehicleId: string;
  maintenanceDate: string;
  maintenanceType: string;
  workshopName: string;
  amount: number;
  odometer: number | null;
  nextServiceDate: string | null;
  description: string;
  invoiceImageUrl: string;
  status: string;
}

export default function EditMaintenancePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [vehicleId, setVehicleId] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [description, setDescription] = useState("");
  const [invoiceImageUrl, setInvoiceImageUrl] = useState("");
  const [status, setStatus] = useState("");

  const maintenanceTypes = [
    "Oil Change", "Tyre", "Battery", "Engine Repair", "Brake Repair", "AC Repair",
    "Service", "Washing", "Accident Repair", "Passing", "Renewal", "Insurance", "Other"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehiclesRes, logRes] = await Promise.all([
          fetch("/api/vehicles"),
          fetch(`/api/maintenance/${id}`)
        ]);

        if (!vehiclesRes.ok || !logRes.ok) throw new Error("Failed to load logs or vehicles");

        const vehiclesData = await vehiclesRes.json();
        const logData: Maintenance = await logRes.json();

        setVehicles(vehiclesData);
        setVehicleId(logData.vehicleId);
        setMaintenanceDate(logData.maintenanceDate.split("T")[0]);
        setMaintenanceType(logData.maintenanceType);
        setWorkshopName(logData.workshopName);
        setAmount(String(logData.amount));
        setOdometer(logData.odometer !== null ? String(logData.odometer) : "");
        setNextServiceDate(logData.nextServiceDate ? logData.nextServiceDate.split("T")[0] : "");
        setDescription(logData.description || "");
        setInvoiceImageUrl(logData.invoiceImageUrl || "");
        setStatus(logData.status);
      } catch (err: any) {
        console.error(err);
        setError("Could not load details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
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

      const res = await fetch(`/api/maintenance/${id}`, {
        method: "PUT",
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
      if (!res.ok) throw new Error(data.error || "Failed to update maintenance record");

      router.push(`/maintenance/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while saving maintenance details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/maintenance/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel & Back to Details
        </Link>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Edit Maintenance Log</h1>
              <p className="text-[10px] text-slate-350 font-semibold mt-0.5">
                Modify repairs description, amounts, workshop notes, odometer reading, and next scheduled service date.
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

            {/* Vehicle selection */}
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
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Next Service Date
                </label>
                <input
                  type="date"
                  value={nextServiceDate}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>
            </div>

            {/* Status and Image URL */}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <Link
                href={`/maintenance/${id}`}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-md transition cursor-pointer"
              >
                {submitting ? "Saving..." : "Save Details"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
