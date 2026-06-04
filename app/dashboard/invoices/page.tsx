"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, Download, Receipt, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Invoice {
  id: string;
  invoiceNumber: string;
  tripId: string;
  tripNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
}

interface Trip {
  id: string;
  tripNumber: string;
  customerName: string;
  tripAmount: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formTrip, setFormTrip] = useState("");
  const [formApplyVat, setFormApplyVat] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, tripsRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/trips"),
      ]);

      if (!invRes.ok || !tripsRes.ok) throw new Error("Failed to load invoices");

      const invData = await invRes.json();
      const tripsData = await tripsRes.json();

      setInvoices(invData.data);
      // Invoices can only be created for trips that don't have an invoice yet
      setTrips(tripsData.data);
      setLiveDb(invData.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formTrip) {
      setFormError("Trip selection is required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: formTrip,
          applyVat: formApplyVat,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");

      const matchingTrip = trips.find(t => t.id === formTrip);
      const newRecord = {
        ...data.data,
        customerName: matchingTrip ? matchingTrip.customerName : data.data.customerName,
        tripNumber: matchingTrip ? matchingTrip.tripNumber : data.data.tripNumber
      };

      setInvoices([newRecord, ...invoices]);
      setFormTrip("");
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // PDF Export Logic for Invoice details
  const exportPDF = (invoice: Invoice) => {
    const doc = new jsPDF();

    // Company Header
    doc.setFillColor(15, 23, 42); // dark slate bg
    doc.rect(0, 0, 210, 40, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("GULF LOGISTICS & TRANSPORT CO.", 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(161, 161, 170);
    doc.text("Sharjah, UAE | Phone: +971 6 543 2100 | info@gulflotrans.com", 15, 28);
    doc.text("Tax Registration Number (TRN): 100234891200003", 15, 33);

    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("TAX INVOICE", 15, 55);

    // Bill To & Details
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("BILL TO:", 15, 68);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(invoice.customerName, 15, 73);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 130, 68);
    doc.text(`Date Issued: ${format(new Date(invoice.invoiceDate), "dd MMM yyyy")}`, 130, 73);
    doc.text(`Due Date: ${format(new Date(invoice.dueDate), "dd MMM yyyy")}`, 130, 78);
    doc.text(`Trip Association: ${invoice.tripNumber}`, 130, 83);

    // Line items table
    const tableBody = [
      [
        "Freight Charges",
        `Transport freight for trip reference: ${invoice.tripNumber}`,
        new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(invoice.amount)
      ],
      [
        "5% Value Added Tax (VAT)",
        "Standard GCC VAT charges applied",
        new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(invoice.vatAmount)
      ]
    ];

    autoTable(doc, {
      startY: 95,
      head: [["Item Description", "Details", "Line Total"]],
      body: tableBody,
      headStyles: { fillColor: [16, 185, 129] }, // emerald theme
      styles: { fontSize: 9 },
      columnStyles: {
        2: { halign: "right" }
      }
    });

    // Totals Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Net Freight Value:", 130, finalY);
    doc.text(new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(invoice.amount), 175, finalY, { align: "right" });

    doc.text("VAT Amount:", 130, finalY + 6);
    doc.text(new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(invoice.vatAmount), 175, finalY + 6, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL DUE (AED):", 130, finalY + 13);
    doc.text(new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(invoice.totalAmount), 175, finalY + 13, { align: "right" });

    // Terms
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Thank you for your business. Payment terms are subject to standard SLA agreements.", 15, finalY + 30);

    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  };

  const filteredInvoices = invoices.filter(
    (i) =>
      i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.status.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Invoicing & Billing</h1>
          <p className="text-xs text-slate-450 font-semibold">Manage client invoice statuses, VAT calculation, and download PDF receipts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">Running in SQLite Database Mode. Custom invoices will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number, customer name..."
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

      {/* Table */}
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
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Trip Code</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4 text-right">VAT</th>
                  <th className="py-3 px-4 text-right">Total Payable</th>
                  <th className="py-3 px-4 text-right">Pending Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-450 font-bold">
                      No invoices created.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-900 font-black flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{inv.invoiceNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-650">{inv.tripNumber}</td>
                      <td className="py-3 px-4 text-slate-900 font-black">{inv.customerName}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{formatCurrency(inv.vatAmount)}</td>
                      <td className="py-3 px-4 text-right text-slate-900 font-black">{formatCurrency(inv.totalAmount)}</td>
                      <td className="py-3 px-4 text-right text-amber-600 font-bold">{formatCurrency(inv.pendingAmount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold tracking-wide uppercase ${
                            inv.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : inv.status === "PARTIALLY_PAID"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => exportPDF(inv)}
                          className="rounded bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Download className="h-3 w-3" /> PDF Invoice
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative">
            <h2 className="text-lg font-black text-slate-900 mb-4">Create Customer Invoice</h2>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-655 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Select Trip Reference *</label>
                <select
                  required
                  value={formTrip}
                  onChange={(e) => setFormTrip(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="">Choose Finished Trip</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber} - {t.customerName} ({formatCurrency(t.tripAmount)})
                    </option>
                  ))}
                </select>
              </div>

              {/* VAT Checkbox */}
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="applyVat"
                  checked={formApplyVat}
                  onChange={(e) => setFormApplyVat(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-250 bg-white text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                />
                <label htmlFor="applyVat" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Apply 5% standard GCC VAT (Tax Registration rules)
                </label>
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
                  {submitting ? "Creating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
