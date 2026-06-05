"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, FileText, ArrowRight, DollarSign, Wallet, Calendar, CheckSquare } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  name: string;
}

interface Invoice {
  invoiceNumber: string;
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/payments", window.location.origin);
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load payments");
      const data = await res.json();
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCount = payments.length;
  const lastPaymentVal = payments.length > 0 ? Number(payments[0].amount) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Accounts Receivable Payments</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Log incoming client receipts, bank wires, cheques, and update outstanding invoices.
          </p>
        </div>
        <Link
          href="/payments/create"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-lg hover:shadow-emerald-600/10 transition duration-200 cursor-pointer w-fit"
        >
          <Plus className="h-4 w-4" /> Receive Payment
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Received</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totalPayments)}</h3>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Receipts Logged</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{totalCount} Transactions</h3>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Receipt Value</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(lastPaymentVal)}</h3>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by cheque #, reference #, client name, invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium transition duration-155"
          />
        </form>

        <button
          onClick={fetchPayments}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Main Table */}
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
                  <th className="py-4 px-5">Client Name</th>
                  <th className="py-4 px-5">Linked Invoice</th>
                  <th className="py-4 px-5 text-right">Amount Received</th>
                  <th className="py-4 px-5">Payment Date</th>
                  <th className="py-4 px-5">Method & Reference</th>
                  <th className="py-4 px-5">Notes</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      No payment transactions found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition duration-150">
                      <td className="py-3.5 px-5 text-slate-900 font-black">{p.customer.name}</td>
                      <td className="py-3.5 px-5 text-emerald-700 font-bold">
                        {p.invoice ? p.invoice.invoiceNumber : <span className="text-slate-400">Unlinked Payment</span>}
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-900 font-black text-sm">{formatCurrency(p.amount)}</td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {format(new Date(p.paymentDate), "dd MMM yyyy")}
                      </td>
                      <td className="py-3.5 px-5 text-slate-700">
                        <span className="block font-bold">{p.paymentMethod}</span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {p.referenceNo || "None"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate">{p.notes || "-"}</td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/payments/${p.id}`}
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
