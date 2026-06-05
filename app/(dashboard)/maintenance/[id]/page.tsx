"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash, RefreshCw, Wrench, AlertTriangle, Calendar, ClipboardList } from "lucide-react";
import { format } from "date-fns";

interface Vehicle {
  id: string;
  truckNo: string;
  plateNo: string;
}

interface Maintenance {
  id: string;
  maintenanceDate: string;
  maintenanceType: string;
  workshopName: string;
  amount: number;
  odometer: number | null;
  nextServiceDate: string | null;
  description: string;
  invoiceImageUrl: string;
  status: string;
  vehicle: Vehicle;
}

export default function MaintenanceDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [log, setLog] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const fetchLog = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/maintenance/${id}`);
      if (!res.ok) throw new Error("Maintenance log not found");
      const data = await res.json();
      setLog(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not load maintenance log details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this maintenance record? This action is permanent and cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const res = await fetch(`/api/maintenance/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete maintenance log");
      }

      router.push("/maintenance");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while deleting the record.");
      setDeleting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED"
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-900">Failed to load record</h3>
        <p className="text-xs text-slate-500 font-semibold">{error || "Maintenance log not found."}</p>
        <Link
          href="/maintenance"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
        >
          Back to Maintenance List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top navigation */}
      <div className="flex justify-between items-center">
        <Link
          href="/maintenance"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Maintenance List
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/maintenance/${id}/edit`}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/50 hover:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100/60 hover:text-rose-950 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <Trash className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">{log.maintenanceType} Log</h1>
              <p className="text-[10px] text-slate-350 font-semibold mt-0.5">
                Vehicle: {log.vehicle.truckNo} ({log.vehicle.plateNo})
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Cost</span>
            <span className="text-xl font-black text-emerald-400">{formatCurrency(log.amount)}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-slate-700">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Workshop / Service Station</span>
              <span className="text-slate-900 font-bold text-sm block">{log.workshopName}</span>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Service Date</span>
              <span className="text-slate-900 font-bold text-sm block">
                {format(new Date(log.maintenanceDate), "dd MMMM yyyy")}
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Odometer Reading</span>
              <span className="text-slate-900 font-mono font-bold text-sm block">
                {log.odometer !== null ? `${log.odometer.toLocaleString()} KM` : "Not recorded"}
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Next Service Due</span>
              <span className="text-slate-900 font-bold text-sm block">
                {log.nextServiceDate ? format(new Date(log.nextServiceDate), "dd MMMM yyyy") : "Not scheduled"}
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Log Status</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide mt-1 ${
                  log.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : log.status === "PENDING"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : "bg-slate-100 text-slate-505 border border-slate-200"
                }`}
              >
                {log.status}
              </span>
            </div>

            {log.invoiceImageUrl && (
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Invoice Image / Doc</span>
                <a
                  href={log.invoiceImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:underline font-bold block"
                >
                  View Attachment File
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {log.description && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Repairs Description & Remarks
              </span>
              <p className="text-xs text-slate-750 font-semibold leading-relaxed whitespace-pre-line">{log.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
