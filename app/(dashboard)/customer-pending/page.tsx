"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw, AlertTriangle, TrendingUp, DollarSign, Wallet, Users, Download } from "lucide-react";
import { format } from "date-fns";

interface CustomerPending {
  id: string;
  name: string;
  companyName: string;
  paymentTerms: string;
  creditLimit: number;
  totalInvoiced: number;
  totalReceived: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
  status: string;
}

export default function CustomerPendingPage() {
  const [data, setData] = useState<CustomerPending[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchPendingData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customer-pending");
      if (!res.ok) throw new Error("Failed to load pending outstanding balances");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  const filteredData = data.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" ||
                          (statusFilter === "OUTSTANDING" && c.pendingAmount > 0) ||
                          (statusFilter === "PAID" && c.pendingAmount === 0);

    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = data.reduce((sum, c) => sum + c.pendingAmount, 0);
  const totalInvoiced = data.reduce((sum, c) => sum + c.totalInvoiced, 0);
  const totalReceived = data.reduce((sum, c) => sum + c.totalReceived, 0);
  const clientsWithDebt = data.filter((c) => c.pendingAmount > 0).length;

  const handleExport = (type: string) => {
    alert(`Exporting outstanding balance report to ${type.toUpperCase()}... (Placeholder implemented)`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Outstanding Ledger</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Real-time accounts receivable outstanding balances aggregated from all tax invoices and customer payments.
          </p>
        </div>
        <div className="flex items-center gap-2 w-fit">
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="h-4 w-4" /> PDF Report
          </button>
          <button
            onClick={() => handleExport("excel")}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Outstanding</span>
            <h3 className="text-lg font-black text-rose-600 mt-0.5">{formatCurrency(totalOutstanding)}</h3>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totalInvoiced)}</h3>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Collected</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totalReceived)}</h3>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clients in Debit</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{clientsWithDebt} Clients</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name or company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium transition duration-155"
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="ALL">All Customers</option>
            <option value="OUTSTANDING">Outstanding Balance Only</option>
            <option value="PAID">Fully Cleared Only</option>
          </select>

          <button
            onClick={fetchPendingData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
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
                  <th className="py-4 px-5">Customer Profile</th>
                  <th className="py-4 px-5">Payment Terms</th>
                  <th className="py-4 px-5 text-right">Credit Limit</th>
                  <th className="py-4 px-5 text-right">Total Invoiced</th>
                  <th className="py-4 px-5 text-right">Total Received</th>
                  <th className="py-4 px-5 text-right">Outstanding balance</th>
                  <th className="py-4 px-5">Last Payment Date</th>
                  <th className="py-4 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                      No customer ledgers found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/40 transition duration-150">
                      <td className="py-3.5 px-5">
                        <span className="block text-slate-900 font-black tracking-tight">{c.name}</span>
                        {c.companyName && c.companyName !== c.name && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">{c.companyName}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-bold">{c.paymentTerms}</td>
                      <td className="py-3.5 px-5 text-right text-slate-500">{formatCurrency(c.creditLimit)}</td>
                      <td className="py-3.5 px-5 text-right text-slate-950">{formatCurrency(c.totalInvoiced)}</td>
                      <td className="py-3.5 px-5 text-right text-emerald-700">{formatCurrency(c.totalReceived)}</td>
                      <td className="py-3.5 px-5 text-right font-black">
                        <span className={c.pendingAmount > 0 ? "text-rose-600" : "text-emerald-700"}>
                          {formatCurrency(c.pendingAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-550">
                        {c.lastPaymentDate ? (
                          format(new Date(c.lastPaymentDate), "dd MMM yyyy")
                        ) : (
                          <span className="text-slate-400 font-medium">Never paid</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black tracking-wide uppercase ${
                            c.pendingAmount === 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {c.status}
                        </span>
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
