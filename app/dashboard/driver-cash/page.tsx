"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface CashRecord {
  id: string;
  tripId: string;
  tripNumber: string;
  amount: number;
  date: string;
  paymentMethod: string;
  notes: string;
}

interface Trip {
  id: string;
  tripNumber: string;
  driverName: string;
}

export default function DriverCashPage() {
  const [cashLogs, setCashLogs] = useState<CashRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formTrip, setFormTrip] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formMethod, setFormMethod] = useState("CASH");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cashRes, tripsRes] = await Promise.all([
        fetch("/api/trips/driver-cash"),
        fetch("/api/trips"),
      ]);

      if (!cashRes.ok || !tripsRes.ok) throw new Error("Failed to load records");

      const cashData = await cashRes.json();
      const tripsData = await tripsRes.json();

      setCashLogs(cashData.data);
      setTrips(tripsData.data);
      setLiveDb(cashData.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formTrip || !formAmount || !formDate) {
      setFormError("Trip, Amount, and Date are required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/trips/driver-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: formTrip,
          amount: parseFloat(formAmount),
          date: formDate,
          paymentMethod: formMethod,
          notes: formNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log cash advance");

      const matchingTrip = trips.find(t => t.id === formTrip);
      const newRecord = {
        ...data.data,
        tripNumber: matchingTrip ? matchingTrip.tripNumber : data.data.tripNumber
      };

      setCashLogs([newRecord, ...cashLogs]);

      // Reset
      setFormTrip("");
      setFormAmount("");
      setFormDate("");
      setFormMethod("CASH");
      setFormNotes("");
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = cashLogs.filter(
    (l) =>
      l.tripNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Driver Cash Advances</h1>
          <p className="text-xs text-slate-450 font-semibold">Record cash / bank transfers given to drivers for road expenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Issue Cash Advance
        </button>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">Running in SQLite Database Mode. Advances will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by trip code, method, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:border-emerald-600 font-medium"
          />
        </div>
        <button
          onClick={fetchData}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-455 bg-slate-50/50">
                  <th className="py-3 px-4">Trip Code</th>
                  <th className="py-3 px-4">Amount Issued</th>
                  <th className="py-3 px-4">Date Issued</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Description / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-450 font-bold">
                      No cash advance logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-900 font-black">{log.tripNumber}</td>
                      <td className="py-3 px-4 text-slate-900 font-black text-sm">
                        {formatCurrency(log.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        {format(new Date(log.date), "dd MMM yyyy")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded bg-slate-105 text-slate-700 text-[10px] font-bold border border-slate-200">
                          {log.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{log.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative">
            <h2 className="text-lg font-black text-slate-900 mb-4">Record Driver Cash Advance</h2>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-650 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddCash} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Select Active Trip *</label>
                <select
                  required
                  value={formTrip}
                  onChange={(e) => setFormTrip(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="">Choose Trip Code</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber} ({t.driverName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Advance Amount (AED) *</label>
                  <input
                    type="number"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="e.g. 1500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Payment Method</label>
                <select
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CARD">Company Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Reference / Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 h-16 resize-none"
                  placeholder="e.g. Diesel fuel advance"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:brightness-105 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Record Advance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
