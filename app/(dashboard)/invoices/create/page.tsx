"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, FileText, Calendar, Percent, PercentIcon } from "lucide-react";

interface Trip {
  id: string;
  tripNumber: string;
  customerName: string;
  customerId: string;
  tripAmount: number;
  status: string;
  hasInvoice: boolean;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [selectedTripId, setSelectedTripId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [vatRate, setVatRate] = useState(5); // Default to 5% VAT
  const [notes, setNotes] = useState("");

  // Auto-fill states
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/trips");
        if (!res.ok) throw new Error("Failed to fetch trips");
        const data = await res.json();
        // Filter for finished trips (COMPLETED or CLOSED) that don't have an invoice yet
        const finishedUninvoiced = (data.data || []).filter(
          (t: Trip) => !t.hasInvoice
        );
        setTrips(finishedUninvoiced);
      } catch (err: any) {
        console.error(err);
        setError("Could not load trips data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  // Set default due date (30 days from invoice date) when invoice date changes
  useEffect(() => {
    if (invoiceDate) {
      const date = new Date(invoiceDate);
      date.setDate(date.getDate() + 30);
      setDueDate(date.toISOString().split("T")[0]);
    }
  }, [invoiceDate]);

  // Track trip selection to auto-fill details
  useEffect(() => {
    const trip = trips.find((t) => t.id === selectedTripId) || null;
    setSelectedTrip(trip);
  }, [selectedTripId, trips]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) {
      setError("Please select a trip reference.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: selectedTripId,
          vatRate,
          notes,
          dueDate: new Date(dueDate).toISOString(),
          invoiceDate: new Date(invoiceDate).toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");

      router.push(`/invoices/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating the invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED"
    }).format(val);
  };

  const subtotal = selectedTrip ? Number(selectedTrip.tripAmount) : 0;
  const vatAmount = (subtotal * vatRate) / 100;
  const totalAmount = subtotal + vatAmount;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back to list */}
      <div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
      </div>

      {/* Card Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Title Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Generate Tax Invoice</h1>
              <p className="text-[10px] text-slate-300 font-semibold mt-0.5">
                Create a professional sequential customer invoice linked directly to a trip.
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

            {/* Trip Selection */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Select Trip Code *
              </label>
              <select
                required
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 px-3.5 py-3 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
              >
                <option value="">-- Choose Uninvoiced Finished Trip --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tripNumber} - {t.customerName} ({formatCurrency(t.tripAmount)}) [{t.status}]
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                Only completed or closed trips that do not have an active invoice are listed.
              </p>
            </div>

            {/* Autofilled Customer Information */}
            {selectedTrip && (
              <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-4 space-y-2">
                <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                  Linked Customer & Pricing Details
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                  <div>
                    <span className="block text-[10px] text-slate-400">Customer Name</span>
                    <span className="text-slate-800">{selectedTrip.customerName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Base Freight Amount</span>
                    <span className="text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Invoice Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-450" />
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-450" />
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>
              </div>
            </div>

            {/* VAT Rate Option */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                GCC Tax Registration / VAT Rules
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 cursor-pointer bg-slate-50 hover:bg-slate-100/60 w-fit">
                  <input
                    type="radio"
                    name="vatRate"
                    checked={vatRate === 5}
                    onChange={() => setVatRate(5)}
                    className="h-4 w-4 text-emerald-600 cursor-pointer"
                  />
                  <span>Standard 5% VAT (UAE/GCC)</span>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 cursor-pointer bg-slate-50 hover:bg-slate-100/60 w-fit">
                  <input
                    type="radio"
                    name="vatRate"
                    checked={vatRate === 0}
                    onChange={() => setVatRate(0)}
                    className="h-4 w-4 text-emerald-600 cursor-pointer"
                  />
                  <span>Zero-rated / Exempt (0% VAT)</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Billing Notes / Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Specify special billing terms, bank details, or delivery confirmation numbers..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
              />
            </div>

            {/* Totals Summary */}
            {selectedTrip && (
              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex justify-between items-center">
                  <span>Subtotal Freight:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>VAT ({vatRate}%):</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-slate-100 pt-2">
                  <span>Total Amount Due (AED):</span>
                  <span className="text-base text-emerald-700">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <Link
                href="/invoices"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !selectedTripId}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Generating..." : "Generate Invoice"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
