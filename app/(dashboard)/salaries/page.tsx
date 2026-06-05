"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, FileText, ArrowRight, DollarSign, Award, Calendar, CheckSquare, Wallet } from "lucide-react";
import { format } from "date-fns";

interface Driver {
  name: string;
}

interface SalaryRecord {
  id: string;
  salaryMonth: string;
  basicSalary: number;
  totalDeduction: number;
  netSalary: number;
  paidAmount: number;
  balance: number;
  status: string;
  notes: string;
  driver: Driver;
}

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/salaries", window.location.origin);
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load salaries");
      const data = await res.json();
      setSalaries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSalaries();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Convert "yyyy-MM" to readable "Month Year"
  const formatMonth = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return format(date, "MMMM yyyy");
    } catch (e) {
      return monthStr;
    }
  };

  const totalPayroll = salaries.reduce((sum, s) => sum + Number(s.netSalary), 0);
  const totalPaid = salaries.reduce((sum, s) => sum + Number(s.paidAmount), 0);
  const totalBalance = salaries.reduce((sum, s) => sum + Number(s.balance), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Driver Payroll & Salaries</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Process driver monthly salary sheets, calculate advance deductions, traffic fines, and trip adjustments.
          </p>
        </div>
        <Link
          href="/salaries/create"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-lg hover:shadow-emerald-600/10 transition duration-200 cursor-pointer w-fit"
        >
          <Plus className="h-4 w-4" /> Process Salary
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Net Payroll</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totalPayroll)}</h3>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid Payroll</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totalPaid)}</h3>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Balance</span>
            <h3 className="text-lg font-black text-rose-600 mt-0.5">{formatCurrency(totalBalance)}</h3>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by driver name or month (YYYY-MM)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium transition duration-155"
          />
        </form>

        <button
          onClick={fetchSalaries}
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
                  <th className="py-4 px-5">Driver Name</th>
                  <th className="py-4 px-5">Salary Month</th>
                  <th className="py-4 px-5 text-right">Basic Salary</th>
                  <th className="py-4 px-5 text-right">Deductions</th>
                  <th className="py-4 px-5 text-right">Net Salary</th>
                  <th className="py-4 px-5 text-right">Paid Amount</th>
                  <th className="py-4 px-5 text-right">Balance</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {salaries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                      No monthly payslip records found.
                    </td>
                  </tr>
                ) : (
                  salaries.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/40 transition duration-150">
                      <td className="py-3.5 px-5 text-slate-900 font-black flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-emerald-650" />
                        <span>{s.driver.name}</span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">{formatMonth(s.salaryMonth)}</td>
                      <td className="py-3.5 px-5 text-right text-slate-700">{formatCurrency(s.basicSalary)}</td>
                      <td className="py-3.5 px-5 text-right text-rose-600">-{formatCurrency(s.totalDeduction)}</td>
                      <td className="py-3.5 px-5 text-right text-slate-900 font-black">{formatCurrency(s.netSalary)}</td>
                      <td className="py-3.5 px-5 text-right text-emerald-700">{formatCurrency(s.paidAmount)}</td>
                      <td className="py-3.5 px-5 text-right text-rose-600 font-bold">{formatCurrency(s.balance)}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black tracking-wide uppercase ${
                            s.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : s.status === "PARTIAL"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/salaries/${s.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-655 hover:text-emerald-850 transition duration-150 cursor-pointer"
                        >
                          <span>Payslip</span>
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
