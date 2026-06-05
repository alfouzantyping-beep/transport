"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, ArrowRight, DollarSign, Tag } from "lucide-react";
import { format } from "date-fns";

interface Vehicle {
  truckNo: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
}

interface VehicleExpense {
  id: string;
  vehicleId: string;
  expenseCategoryId: string;
  expenseDate: string;
  amount: number;
  description: string | null;
  referenceNo: string | null;
  vehicle: Vehicle;
  expenseCategory: ExpenseCategory;
}

export default function VehicleExpensesPage() {
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/expense-categories?type=VEHICLE");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/vehicle-expenses", window.location.origin);
      if (searchQuery) url.searchParams.set("search", searchQuery);
      if (categoryFilter !== "ALL") url.searchParams.set("categoryId", categoryFilter);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch vehicle expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalCost = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCount = expenses.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vehicle Expenses</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Manage direct vehicle-specific expenses not related to individual trips, such as fines, renewal costs, and insurance.
          </p>
        </div>
        <Link
          href="/vehicle-expenses/create"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-lg hover:shadow-emerald-600/10 transition duration-200 cursor-pointer w-fit"
        >
          <Plus className="h-4 w-4" /> Log Vehicle Expense
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Direct Expense Amount</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totalCost)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged Expense Count</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{totalCount} Record{totalCount !== 1 ? "s" : ""}</h3>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by truck #, reference #, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium transition duration-155"
          />
        </form>

        <div className="flex w-full md:w-auto items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer animate-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={fetchExpenses}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
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
                  <th className="py-4 px-5">Truck</th>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Reference No</th>
                  <th className="py-4 px-5">Description</th>
                  <th className="py-4 px-5 text-right">Amount</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      No vehicle expenses found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/40 transition duration-150">
                      <td className="py-3.5 px-5 text-slate-900 font-black">{expense.vehicle.truckNo}</td>
                      <td className="py-3.5 px-5 text-slate-650">
                        {format(new Date(expense.expenseDate), "dd MMM yyyy")}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {expense.expenseCategory.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-650 font-mono">{expense.referenceNo || "-"}</td>
                      <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate font-medium">{expense.description || "-"}</td>
                      <td className="py-3.5 px-5 text-right text-slate-900 font-black">{formatCurrency(expense.amount)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/vehicle-expenses/${expense.id}/edit`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-650 hover:text-emerald-800 transition duration-150 cursor-pointer"
                        >
                          <span>Edit</span>
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
