"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, Wrench, ArrowRight, DollarSign, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface Vehicle {
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
  status: string;
  vehicle: Vehicle;
}

export default function MaintenancePage() {
  const [logs, setLogs] = useState<Maintenance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/maintenance", window.location.origin);
      if (searchQuery) url.searchParams.set("search", searchQuery);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalCost = logs.filter(l => l.status === "COMPLETED").reduce((sum, l) => sum + Number(l.amount), 0);
  const pendingCount = logs.filter(l => l.status === "PENDING").length;
  const completedCount = logs.filter(l => l.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vehicle Maintenance Logs</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Track vehicle workshop logs, oil checks, tire replacements, passing updates, and scheduled next services.
          </p>
        </div>
        <Link
          href="/maintenance/create"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-lg hover:shadow-emerald-600/10 transition duration-200 cursor-pointer w-fit"
        >
          <Plus className="h-4 w-4" /> Log Maintenance
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Cost</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totalCost)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Repairs</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{pendingCount} Logs</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Services</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{completedCount} Logs</h3>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by truck #, workshop, type, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium transition duration-155"
          />
        </form>

        <div className="flex w-full md:w-auto items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="py-4 px-5">Truck</th>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Maintenance Type</th>
                  <th className="py-4 px-5">Workshop</th>
                  <th className="py-4 px-5 text-right">Odometer</th>
                  <th className="py-4 px-5 text-right">Cost</th>
                  <th className="py-4 px-5">Next Service</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                      No maintenance logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition duration-150">
                      <td className="py-3.5 px-5 text-slate-900 font-black">{log.vehicle.truckNo}</td>
                      <td className="py-3.5 px-5 text-slate-650">
                        {format(new Date(log.maintenanceDate), "dd MMM yyyy")}
                      </td>
                      <td className="py-3.5 px-5 text-slate-800 font-bold">{log.maintenanceType}</td>
                      <td className="py-3.5 px-5 text-slate-700">{log.workshopName}</td>
                      <td className="py-3.5 px-5 text-right text-slate-500 font-mono">
                        {log.odometer !== null ? `${log.odometer.toLocaleString()} km` : "-"}
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-900 font-black">{formatCurrency(log.amount)}</td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {log.nextServiceDate ? (
                          format(new Date(log.nextServiceDate), "dd MMM yyyy")
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black tracking-wide uppercase ${
                            log.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : log.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/maintenance/${log.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-650 hover:text-emerald-800 transition duration-150 cursor-pointer"
                        >
                          <span>Details</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
