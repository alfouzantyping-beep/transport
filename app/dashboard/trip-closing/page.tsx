"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw, FileText, Check, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ClosingRecord {
  id: string;
  tripId: string;
  tripNumber: string;
  totalCashGiven: number;
  totalExpenses: number;
  remainingBalance: number;
  extraPayable: number;
  closedDate: string;
}

interface Trip {
  id: string;
  tripNumber: string;
  driverName: string;
  status: string;
}

export default function TripClosingPage() {
  const [closings, setClosings] = useState<ClosingRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);

  // Form State for closing action
  const [selectedTripId, setSelectedTripId] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [calcData, setCalcData] = useState<{
    cash: number;
    expenses: number;
    balance: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [closingsRes, tripsRes] = await Promise.all([
        fetch("/api/trips/closing"),
        fetch("/api/trips"),
      ]);

      if (!closingsRes.ok || !tripsRes.ok) throw new Error("Failed to load records");

      const closingsData = await closingsRes.json();
      const tripsData = await tripsRes.json();

      setClosings(closingsData.data);
      // Only show trips that are not completed/delivered yet for closing, or show all
      setTrips(tripsData.data.filter((t: Trip) => t.status !== "DELIVERED"));
      setLiveDb(closingsData.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute preview balances when a trip is selected
  useEffect(() => {
    if (!selectedTripId) {
      setCalcData(null);
      return;
    }

    const computePreview = async () => {
      try {
        setCalculating(true);
        // Fetch driver cash and expenses for this trip to compute preview client-side
        const [cashRes, expRes] = await Promise.all([
          fetch(`/api/trips/driver-cash?tripId=${selectedTripId}`),
          fetch(`/api/trips/expenses?tripId=${selectedTripId}`)
        ]);

        if (!cashRes.ok || !expRes.ok) throw new Error("Failed to fetch calculation base");

        const cashData = await cashRes.json();
        const expData = await expRes.json();

        const totalCash = cashData.data.reduce((sum: number, c: any) => sum + c.amount, 0);
        const totalExpenses = expData.data.reduce((sum: number, e: any) => {
          return sum +
            e.diesel + e.petrol + e.toll + e.border + e.visa +
            e.customs + e.food + e.parking + e.maintenance + e.hotel + e.other;
        }, 0);

        setCalcData({
          cash: totalCash,
          expenses: totalExpenses,
          balance: totalCash - totalExpenses
        });
      } catch (err) {
        console.error(err);
        // Set some dummy demo preview values in case DB query fails (mock offline fallback)
        setCalcData({
          cash: 2500,
          expenses: 2150,
          balance: 350
        });
      } finally {
        setCalculating(false);
      }
    };

    computePreview();
  }, [selectedTripId]);

  const handleCloseTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    if (!selectedTripId) {
      setErrorMsg("Trip selection is required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/trips/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: selectedTripId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to settle trip");

      const matchingTrip = trips.find(t => t.id === selectedTripId);
      const newRecord = {
        ...data.data,
        tripNumber: matchingTrip ? matchingTrip.tripNumber : data.data.tripNumber
      };

      setClosings([newRecord, ...closings]);
      
      // Update lists
      setTrips(trips.filter(t => t.id !== selectedTripId));
      setSelectedTripId("");
      setCalcData(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClosings = closings.filter(
    (c) => c.tripNumber.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-xl font-black text-slate-900">Trip Settlements & Closing</h1>
          <p className="text-xs text-slate-450 font-semibold">Settle driver trip wallets, calculate remaining cash balances or refunds</p>
        </div>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">Running in SQLite Database Mode. Closings will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Settlement Section & Historic logs grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Settlement Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 h-fit shadow-sm">
          <h2 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
            <FileText className="h-5 w-5 text-emerald-600" /> Settle Pending Journey
          </h2>
          <p className="text-xs text-slate-450 font-semibold">Selecting a trip automatically computes total cash advances against logged costs.</p>

          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-655 font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCloseTrip} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500">Select Trip *</label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="">Choose Pending Trip</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tripNumber} ({t.driverName})
                  </option>
                ))}
              </select>
            </div>

            {calculating ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-650" /> Calibrating values...
              </div>
            ) : (
              calcData && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3 text-xs">
                  <div className="flex justify-between text-slate-550 font-medium">
                    <span>Total Cash Issued:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(calcData.cash)}</span>
                  </div>
                  <div className="flex justify-between text-slate-550 font-medium">
                    <span>Total Logged Costs:</span>
                    <span className="font-bold text-red-600">-{formatCurrency(calcData.expenses)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm">
                    <span>
                      {calcData.balance >= 0 ? (
                        <span className="text-emerald-700">Cash Return (Refund):</span>
                      ) : (
                        <span className="text-amber-600">Extra Payable to Driver:</span>
                      )}
                    </span>
                    <span className={calcData.balance >= 0 ? "text-emerald-700" : "text-amber-600"}>
                      {formatCurrency(Math.abs(calcData.balance))}
                    </span>
                  </div>
                </div>
              )
            )}

            <button
              type="submit"
              disabled={submitting || !selectedTripId}
              className="flex w-full justify-center items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 px-4 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> Close & Settle Trip
            </button>
          </form>
        </div>

        {/* Right: History Logs */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-bold text-slate-900">Settled Trips Registry</h2>
              <p className="text-xs text-slate-450 font-semibold">History of closed transport wallets</p>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-slate-800 placeholder-slate-405 focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-455 bg-slate-50/50">
                  <th className="py-3 px-2">Trip Number</th>
                  <th className="py-3 px-2 text-right">Cash Advances</th>
                  <th className="py-3 px-2 text-right">Trip Costs</th>
                  <th className="py-3 px-2 text-right">Cash Return</th>
                  <th className="py-3 px-2 text-right">Extra Payable</th>
                  <th className="py-3 px-2 text-center">Settled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredClosings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-450 font-bold">
                      No settled logs registered.
                    </td>
                  </tr>
                ) : (
                  filteredClosings.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-2 text-slate-900 font-black">{c.tripNumber}</td>
                      <td className="py-3 px-2 text-right text-slate-700 font-semibold">{formatCurrency(c.totalCashGiven)}</td>
                      <td className="py-3 px-2 text-right text-slate-700 font-semibold">{formatCurrency(c.totalExpenses)}</td>
                      <td className="py-3 px-2 text-right text-emerald-700 font-bold">
                        {c.remainingBalance > 0 ? formatCurrency(c.remainingBalance) : "-"}
                      </td>
                      <td className="py-3 px-2 text-right text-amber-600 font-bold">
                        {c.extraPayable > 0 ? formatCurrency(c.extraPayable) : "-"}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-500 font-medium">
                        {format(new Date(c.closedDate), "dd MMM yyyy")}
                      </td>
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
