"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Landmark, Calendar, User, FileText, CheckCircle2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
}

function CreatePaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters for pre-filling
  const urlCustomerId = searchParams.get("customerId") || "";
  const urlInvoiceId = searchParams.get("invoiceId") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Cheque");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");

  // Loaded Invoice Info
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [custRes, invRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/invoices")
        ]);

        if (!custRes.ok || !invRes.ok) throw new Error("Failed to load customer/invoice list");

        const custData = await custRes.json();
        const invData = await invRes.json();

        setCustomers(custData.data || []);
        // Invoices with pending balance > 0
        setInvoices(invData.filter((i: Invoice) => Number(i.pendingAmount) > 0 && i.status !== "CANCELLED"));

        // If pre-filled parameters are provided in URL, set them
        if (urlCustomerId) {
          setSelectedCustomerId(urlCustomerId);
        }
        if (urlInvoiceId) {
          setSelectedInvoiceId(urlInvoiceId);
        }
      } catch (err: any) {
        console.error(err);
        setError("Could not load form requirements.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [urlCustomerId, urlInvoiceId]);

  // Adjust pre-filled fields if customer or invoice selection changes
  useEffect(() => {
    const invoice = invoices.find((i) => i.id === selectedInvoiceId) || null;
    setSelectedInvoice(invoice);
    if (invoice) {
      setAmount(String(invoice.pendingAmount));
      // Auto-set customer ID to match invoice customer if they select invoice first
      if (invoice.customerId && invoice.customerId !== selectedCustomerId) {
        setSelectedCustomerId(invoice.customerId);
      }
    }
  }, [selectedInvoiceId, invoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !amount || !paymentDate || !paymentMethod) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          invoiceId: selectedInvoiceId || null,
          amount: parseFloat(amount),
          paymentDate: new Date(paymentDate).toISOString(),
          paymentMethod,
          referenceNo,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log payment");

      router.push(`/payments/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while posting payment.");
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back to list */}
      <div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Payments List
        </Link>
      </div>

      {/* Card Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Title Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Receive & Log Payment</h1>
              <p className="text-[10px] text-slate-300 font-semibold mt-0.5">
                Register bank deposits, cash, or cheques and update invoices outstanding accounts receivable.
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

            {/* Customer Selection */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Select Customer Profile *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedInvoiceId(""); // Reset invoice when customer changes
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 pl-10 pr-3.5 py-3 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Link Invoice Selection */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Link to Pending Invoice (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 pl-10 pr-3.5 py-3 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                >
                  <option value="">Pre-payment / General Account (No Invoice link)</option>
                  {invoices
                    .filter((i) => !selectedCustomerId || i.customerId === selectedCustomerId)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.invoiceNumber} (Total: {formatCurrency(i.totalAmount)} | Pending: {formatCurrency(i.pendingAmount)})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Link Invoice details card */}
            {selectedInvoice && (
              <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-4 space-y-1.5 text-xs font-semibold text-slate-700">
                <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                  Linked Invoice Details
                </div>
                <div className="flex justify-between">
                  <span>Invoice Number:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Outstanding:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedInvoice.pendingAmount)}</span>
                </div>
              </div>
            )}

            {/* Amount and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Amount Received (AED) *
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Receipt Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-450" />
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
              </div>
            </div>

            {/* Method and reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer"
                >
                  <option value="Cheque">Bank Cheque</option>
                  <option value="Wire Transfer">Telegraphic Transfer (TT)</option>
                  <option value="Cash">Cash Deposit</option>
                  <option value="Online Link">Payment Link Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Cheque / Transfer Reference #
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Txn ID, Cheque # or Deposit ref"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>
            </div>

            {/* Internal Memo */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Internal Remarks / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Cheque clearing dates, banker instructions, or custom notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <Link
                href="/payments"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !selectedCustomerId || !amount}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Log Receipt"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CreatePaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <CreatePaymentForm />
    </Suspense>
  );
}
