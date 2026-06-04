"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId: string | null;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  pendingAmount: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formCustomer, setFormCustomer] = useState("");
  const [formInvoice, setFormInvoice] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formMethod, setFormMethod] = useState("Cheque");
  const [formRef, setFormRef] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, custRes, invRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/customers"),
        fetch("/api/invoices"),
      ]);

      if (!payRes.ok || !custRes.ok || !invRes.ok) throw new Error("Failed to load payment console");

      const payData = await payRes.json();
      const custData = await custRes.json();
      const invData = await invRes.json();

      setPayments(payData.data);
      setCustomers(custData.data);
      // Filter out paid invoices for linking
      setInvoices(invData.data.filter((i: Invoice) => i.pendingAmount > 0));
      setLiveDb(payData.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formCustomer || !formAmount || !formDate || !formMethod) {
      setFormError("Customer, Amount, Date, and Method are required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formCustomer,
          invoiceId: formInvoice || null,
          amount: parseFloat(formAmount),
          paymentDate: formDate,
          paymentMethod: formMethod,
          referenceNumber: formRef,
          notes: formNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post payment");

      const matchingCust = customers.find(c => c.id === formCustomer);
      const matchingInv = invoices.find(i => i.id === formInvoice);

      const newRecord = {
        ...data.data,
        customerName: matchingCust ? matchingCust.name : data.data.customerName,
        invoiceNumber: matchingInv ? matchingInv.invoiceNumber : data.data.invoiceNumber
      };

      setPayments([newRecord, ...payments]);

      // Reset
      setFormCustomer("");
      setFormInvoice("");
      setFormAmount("");
      setFormDate("");
      setFormMethod("Cheque");
      setFormRef("");
      setFormNotes("");
      setShowModal(false);
      
      // Refresh state to update invoices list pending balances
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Received Payments Logs</h1>
          <p className="text-xs text-slate-450 font-semibold">Record customer accounts receivable receipts, wire references and cheque clearances</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Receive Payment
        </button>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">Running in SQLite Database Mode. Custom payments will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, invoice ID, cheque/reference..."
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
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Linked Invoice</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Method & Ref #</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-450 font-bold">
                      No payment logs registered.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-900 font-black">{p.customerName}</td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">{p.invoiceNumber}</td>
                      <td className="py-3 px-4 text-right text-slate-900 font-black text-sm">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {format(new Date(p.paymentDate), "dd MMM yyyy")}
                      </td>
                      <td className="py-3 px-4 text-slate-655 font-semibold">
                        <div>{p.paymentMethod}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.referenceNumber || "No reference"}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.notes || "-"}</td>
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
            <h2 className="text-lg font-black text-slate-900 mb-4">Post Incoming Payment</h2>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-655 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleReceivePayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Select Customer *</label>
                <select
                  required
                  value={formCustomer}
                  onChange={(e) => setFormCustomer(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="">Choose Customer Profile</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Link Outstanding Invoice (Optional)</label>
                <select
                  value={formInvoice}
                  onChange={(e) => setFormInvoice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="">No Invoice link (Pre-payment / General Account)</option>
                  {invoices
                    .filter(i => !formCustomer || i.customerName === customers.find(c => c.id === formCustomer)?.name)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.invoiceNumber} (Pending: {formatCurrency(i.pendingAmount)})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Amount Received (AED) *</label>
                  <input
                    type="number"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="e.g. 5000"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Payment Method *</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="Cheque">Bank Cheque</option>
                    <option value="Wire Transfer">Telegraphic Transfer (TT)</option>
                    <option value="Cash">Cash Deposit</option>
                    <option value="Online Link">Payment Link Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Cheque / Txn Reference #</label>
                  <input
                    type="text"
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="Chq # or Bank Reference"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Internal Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 h-16 resize-none"
                  placeholder="Additional clearing instructions..."
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
                  {submitting ? "Processing..." : "Log Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
