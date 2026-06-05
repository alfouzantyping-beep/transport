"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Trash, Landmark, AlertTriangle, CheckSquare, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  name: string;
  trn: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNo: string;
  notes: string;
  customer: Customer;
  invoice: Invoice | null;
}

export default function PaymentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payments/${id}`);
      if (!res.ok) throw new Error("Payment transaction not found");
      const data = await res.json();
      setPayment(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not load payment transaction details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to reverse this payment? This will decrease the paid amount on the linked invoice and increase its pending balance. This action is irreversible.")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const res = await fetch(`/api/payments/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete payment");
      }

      router.push("/payments");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while reversing the payment.");
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

  if (error || !payment) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-900">Failed to load payment</h3>
        <p className="text-xs text-slate-500 font-semibold">{error || "Payment transaction record not found."}</p>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
        >
          Back to Payments List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top navigation */}
      <div className="flex justify-between items-center">
        <Link
          href="/payments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Payments
        </Link>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1 px-3.5 py-2 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100/60 hover:text-rose-950 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          <Trash className="h-3.5 w-3.5" /> Reverse Payment
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Payment Transaction Receipt</h1>
              <p className="text-[10px] text-slate-350 font-semibold mt-0.5">
                Receipt reference: {payment.id.substring(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount Received</span>
            <span className="text-xl font-black text-emerald-400">{formatCurrency(payment.amount)}</span>
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
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Customer / Client</span>
              <span className="text-slate-900 font-bold text-sm block">{payment.customer.name}</span>
              {payment.customer.trn && (
                <span className="text-slate-500 text-[10px] block mt-0.5">TRN: {payment.customer.trn}</span>
              )}
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Payment Method & Date</span>
              <span className="text-slate-900 font-bold block">{payment.paymentMethod}</span>
              <span className="text-slate-500 text-[10px] block mt-0.5">
                Received: {format(new Date(payment.paymentDate), "dd MMMM yyyy")}
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Cheque / Txn Reference</span>
              <span className="text-slate-900 font-mono font-bold text-sm block">{payment.referenceNo || "No Reference Given"}</span>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Linked Invoice</span>
              {payment.invoice ? (
                <Link
                  href={`/invoices/${payment.invoice.id}`}
                  className="text-emerald-700 hover:underline font-bold block"
                >
                  {payment.invoice.invoiceNumber}
                  <span className="text-[10px] font-medium text-slate-400 ml-1">
                    (Total: {formatCurrency(payment.invoice.totalAmount)} | Status: {payment.invoice.status})
                  </span>
                </Link>
              ) : (
                <span className="text-slate-400 block font-medium">Pre-payment / General Account</span>
              )}
            </div>
          </div>

          {/* Remarks */}
          {payment.notes && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Transaction Notes
              </span>
              <p className="text-xs text-slate-750 font-semibold leading-relaxed whitespace-pre-line">{payment.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
