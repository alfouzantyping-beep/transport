"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, FileText, Calendar, Edit3 } from "lucide-react";

interface Customer {
  name: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  notes: string;
  customer: Customer;
}

export default function EditInvoicePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [subtotal, setSubtotal] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(0);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) throw new Error("Invoice not found");
        const data = await res.json();
        setInvoice(data);
        setInvoiceDate(data.invoiceDate.split("T")[0]);
        setDueDate(data.dueDate.split("T")[0]);
        setStatus(data.status);
        setNotes(data.notes || "");
        setSubtotal(Number(data.subtotal));
        setVatRate(Number(data.vatRate));
      } catch (err: any) {
        console.error(err);
        setError("Could not load invoice data.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceDate: new Date(invoiceDate).toISOString(),
          dueDate: new Date(dueDate).toISOString(),
          status,
          notes,
          subtotal,
          vatRate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update invoice");

      router.push(`/invoices/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while updating the invoice.");
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

  const currentVatAmount = (subtotal * vatRate) / 100;
  const currentTotalAmount = subtotal + currentVatAmount;
  const currentPendingAmount = currentTotalAmount - (invoice ? Number(invoice.paidAmount) : 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="text-rose-500 font-bold">{error}</div>
        <Link href="/invoices" className="text-xs text-emerald-650 hover:underline">
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back to details */}
      <div>
        <Link
          href={`/invoices/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel & Back to Details
        </Link>
      </div>

      {/* Card Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Edit Tax Invoice</h1>
              <p className="text-[10px] text-slate-300 font-semibold mt-0.5">
                Update billing dates, notes, adjustments, and tax calculations for {invoice?.invoiceNumber}.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          {/* Customer (Readonly) */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
              Customer / Client (Read-Only)
            </label>
            <input
              type="text"
              disabled
              value={invoice?.customer.name || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-100/50 px-3.5 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Pricing Adjustments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Subtotal Freight (AED)
              </label>
              <input
                type="number"
                required
                value={subtotal}
                onChange={(e) => setSubtotal(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                VAT Rate (%)
              </label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              >
                <option value={5}>5% Standard GCC VAT</option>
                <option value={0}>0% Zero Rated / Exempt</option>
              </select>
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>
            </div>

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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Invoice Status */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Invoice Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer"
            >
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Billing Remarks / Terms
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
            />
          </div>

          {/* Math Review */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs font-semibold text-slate-700">
            <div className="flex justify-between">
              <span>Recalculated Subtotal:</span>
              <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Recalculated VAT Amount:</span>
              <span>{formatCurrency(currentVatAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid To Date (Read-Only):</span>
              <span className="text-emerald-700 font-bold">{formatCurrency(invoice ? Number(invoice.paidAmount) : 0)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-100 text-sm">
              <span>Updated Total Amount:</span>
              <span className="text-emerald-700">{formatCurrency(currentTotalAmount)}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-black pt-1">
              <span>Remaining Balance:</span>
              <span>{formatCurrency(currentPendingAmount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
            <Link
              href={`/invoices/${id}`}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-105 transition cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
