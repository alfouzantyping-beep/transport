"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, FileText, ArrowRight, TrendingUp, DollarSign, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  name: string;
}

interface Trip {
  id: string;
  tripNumber: string;
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
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/invoices", window.location.origin);
      if (statusFilter !== "ALL") {
        url.searchParams.set("status", statusFilter);
      }
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Calculations for summary stats
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
  const totalPending = invoices.reduce((sum, inv) => sum + Number(inv.pendingAmount), 0);
  const unpaidCount = invoices.filter(inv => inv.status !== "PAID" && inv.status !== "CANCELLED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoice & Billing</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Manage tax invoicing, GCC VAT rules, customer accounts receivable, and print vouchers.
          </p>
        </div>
        <Link
          href="/invoices/create"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-lg hover:shadow-emerald-600/10 transition duration-200 cursor-pointer w-fit"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition duration-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totalInvoiced)}</h3>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition duration-200 flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payments Received</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totalPaid)}</h3>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition duration-200 flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Outstanding</span>
            <h3 className="text-lg font-black text-rose-600 mt-0.5">{formatCurrency(totalPending)}</h3>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition duration-200 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Unpaid Invoices</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{unpaidCount} Invoices</h3>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, trip code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium transition duration-155"
          />
        </form>

        <div className="flex w-full md:w-auto items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchInvoices}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition duration-150"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table Section */}
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
                  <th className="py-4 px-5">Invoice Details</th>
                  <th className="py-4 px-5">Trip Ref</th>
                  <th className="py-4 px-5">Client Name</th>
                  <th className="py-4 px-5 text-right">Subtotal</th>
                  <th className="py-4 px-5 text-right">VAT</th>
                  <th className="py-4 px-5 text-right">Total AED</th>
                  <th className="py-4 px-5 text-right">Pending Balance</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/40 transition duration-150">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-650 shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-slate-900 font-black tracking-tight">{inv.invoiceNumber}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Issued {format(new Date(inv.invoiceDate), "dd MMM yyyy")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-550 font-mono text-[11px]">{inv.trip?.tripNumber || "Mock"}</td>
                      <td className="py-3.5 px-5 text-slate-900 font-bold">{inv.customer?.name || "Unknown"}</td>
                      <td className="py-3.5 px-5 text-right text-slate-500">{formatCurrency(inv.subtotal)}</td>
                      <td className="py-3.5 px-5 text-right text-slate-550">
                        {formatCurrency(inv.vatAmount)}
                        <span className="block text-[9px] text-slate-400 mt-0.5">({inv.vatRate}%)</span>
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-900 font-black">{formatCurrency(inv.totalAmount)}</td>
                      <td className="py-3.5 px-5 text-right text-rose-600 font-bold">{formatCurrency(inv.pendingAmount)}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black tracking-wide uppercase ${
                            inv.status === "PAID"
                              ? "bg-emerald-55/10 text-emerald-700 border border-emerald-250/20"
                              : inv.status === "PARTIAL"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : inv.status === "CANCELLED"
                              ? "bg-slate-100 text-slate-500 border border-slate-200"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-650 hover:text-emerald-800 transition duration-150 cursor-pointer"
                        >
                          <span>Manage</span>
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
