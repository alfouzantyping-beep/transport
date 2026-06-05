"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Printer, Trash, RefreshCw, CheckCircle2, AlertTriangle, CreditCard, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  name: string;
  trn: string;
  address: string;
  phone: string;
  email: string;
}

interface Driver {
  name: string;
}

interface Vehicle {
  truckNo: string;
  plateNo: string;
}

interface Trip {
  id: string;
  tripNumber: string;
  tripDate: string;
  fromCountry: string;
  toCountry: string;
  loadingPoint: string;
  deliveryPoint: string;
  doNumber: string;
  cargoType: string;
  cargoWeight: number;
  driver: Driver;
  vehicle: Vehicle;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNo: string;
  notes: string;
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
  trip: Trip;
  payments: Payment[];
}

export default function InvoiceDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("Invoice not found");
      const data = await res.json();
      setInvoice(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not load invoice details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this invoice? The linked trip's status will reset to CLOSED, and all local invoice data will be removed.")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete invoice");
      }

      router.push("/invoices");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while deleting the invoice.");
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

  if (error || !invoice) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-900">Failed to load invoice</h3>
        <p className="text-xs text-slate-500 font-semibold">{error || "Invoice record not found."}</p>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
        >
          Back to Invoices List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/invoices/${id}/edit`}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/50 hover:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Link>
          <Link
            href={`/invoices/${id}/print`}
            target="_blank"
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/50 hover:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> Print Voucher
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

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header invoice summary card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 mb-2">
                  TAX INVOICE
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{invoice.invoiceNumber}</h2>
                <p className="text-[10px] text-slate-450 mt-1">
                  Issued: {format(new Date(invoice.invoiceDate), "dd MMM yyyy")} | Due: {format(new Date(invoice.dueDate), "dd MMM yyyy")}
                </p>
              </div>

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black tracking-wide uppercase ${
                  invoice.status === "PAID"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : invoice.status === "PARTIAL"
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : invoice.status === "CANCELLED"
                    ? "bg-slate-100 text-slate-505 border border-slate-200"
                    : "bg-rose-50 text-rose-700 border border-rose-100"
                }`}
              >
                {invoice.status}
              </span>
            </div>

            {/* Billing Addresses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-700">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Company Details</span>
                <span className="block text-slate-900 font-bold">Gulf Logistics & Transport Co.</span>
                <span className="block text-slate-500">Sharjah, UAE</span>
                <span className="block text-slate-500">TRN: 100234891200003</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Billed To</span>
                <span className="block text-slate-900 font-bold">{invoice.customer.name}</span>
                <span className="block text-slate-500">{invoice.customer.address}</span>
                <span className="block text-slate-500">TRN: {invoice.customer.trn || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Linked Trip Details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 tracking-tight border-b border-slate-100 pb-3">
              Associated Logistical Trip Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
              <div>
                <span className="block text-[10px] text-slate-400">Trip Reference</span>
                <span className="text-slate-900 font-mono text-[11px]">{invoice.trip.tripNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Trip Date</span>
                <span className="text-slate-900">
                  {format(new Date(invoice.trip.tripDate), "dd MMM yyyy")}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Cargo Type / Weight</span>
                <span className="text-slate-900">{invoice.trip.cargoType} ({invoice.trip.cargoWeight} Tons)</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Loading Port</span>
                <span className="text-slate-900">{invoice.trip.loadingPoint} ({invoice.trip.fromCountry})</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Delivery Destination</span>
                <span className="text-slate-900">{invoice.trip.deliveryPoint} ({invoice.trip.toCountry})</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">DO Number</span>
                <span className="text-slate-900">{invoice.trip.doNumber || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Invoice Remarks */}
          {invoice.notes && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Invoice Notes & Terms
              </span>
              <p className="text-xs text-slate-750 font-semibold leading-relaxed whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Associated Payments */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 tracking-tight border-b border-slate-100 pb-3">
              Payment Receipts History
            </h3>

            {invoice.payments.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold text-center py-6">
                No payments have been logged against this invoice yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 font-semibold text-xs text-slate-700">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="py-3.5 flex justify-between items-center hover:bg-slate-50/50 transition">
                    <div>
                      <span className="block text-slate-900 font-bold">
                        {p.paymentMethod} - {p.referenceNo || "No Reference"}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Logged on {format(new Date(p.paymentDate), "dd MMM yyyy")}
                      </span>
                      {p.notes && <span className="block text-[10px] text-slate-500 italic mt-0.5">{p.notes}</span>}
                    </div>
                    <span className="text-sm font-black text-emerald-700">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Summary Box */}
        <div className="space-y-4">
          {/* Summary Financial breakdown card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 tracking-tight border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
              <span>Financial Summary</span>
            </h3>

            <div className="space-y-2.5 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal Freight:</span>
                <span className="text-slate-900 font-bold">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT Charge ({invoice.vatRate}%):</span>
                <span className="text-slate-900 font-bold">{formatCurrency(invoice.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-100 text-sm">
                <span>Total Invoice Due:</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs font-semibold text-slate-700">
              <div className="flex justify-between text-emerald-700">
                <span>Total Received:</span>
                <span className="font-bold">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-black text-sm bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                <span>Outstanding:</span>
                <span>{formatCurrency(invoice.pendingAmount)}</span>
              </div>
            </div>

            {/* Quick Actions relative to payments */}
            {invoice.pendingAmount > 0 && invoice.status !== "CANCELLED" && (
              <Link
                href={{
                  pathname: "/payments/create",
                  query: { customerId: invoice.customer.id, invoiceId: invoice.id }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white hover:brightness-105 transition cursor-pointer"
              >
                <CreditCard className="h-4 w-4" /> Log Invoice Payment
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
