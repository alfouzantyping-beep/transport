"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag, RefreshCw, Edit3, Trash2 } from "lucide-react";

interface Vehicle {
  id: string;
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
  description: string;
  referenceNo: string;
}

export default function EditVehicleExpensePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [vehicleId, setVehicleId] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehiclesRes, categoriesRes, expenseRes] = await Promise.all([
          fetch("/api/vehicles"),
          fetch("/api/expense-categories?type=VEHICLE"),
          fetch(`/api/vehicle-expenses/${id}`)
        ]);

        if (!vehiclesRes.ok || !categoriesRes.ok || !expenseRes.ok) {
          throw new Error("Failed to load dependency data or expense log");
        }

        const vehiclesData = await vehiclesRes.json();
        const categoriesData = await categoriesRes.json();
        const expenseData: VehicleExpense = await expenseRes.json();

        setVehicles(vehiclesData);
        setCategories(categoriesData);

        setVehicleId(expenseData.vehicleId);
        setExpenseCategoryId(expenseData.expenseCategoryId);
        setExpenseDate(expenseData.expenseDate.split("T")[0]);
        setAmount(String(expenseData.amount));
        setReferenceNo(expenseData.referenceNo || "");
        setDescription(expenseData.description || "");
      } catch (err: any) {
        console.error(err);
        setError("Could not load vehicle expense details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!vehicleId) {
      setError("Vehicle is required.");
      return;
    }
    if (!expenseCategoryId) {
      setError("Expense category is required.");
      return;
    }
    if (!expenseDate) {
      setError("Expense date is required.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`/api/vehicle-expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          expenseCategoryId,
          expenseDate,
          amount: parsedAmount,
          referenceNo,
          description
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update vehicle expense");

      router.push("/vehicle-expenses");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while updating vehicle expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this vehicle expense record? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const res = await fetch(`/api/vehicle-expenses/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete vehicle expense");

      router.push("/vehicle-expenses");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while deleting vehicle expense.");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/vehicle-expenses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel & Back to List
        </Link>
        {!loading && (
          <button
            onClick={handleDelete}
            disabled={deleting || submitting}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting..." : "Delete Record"}
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Edit Vehicle Expense</h1>
              <p className="text-[10px] text-slate-350 font-semibold mt-0.5">
                Update the vehicle reference, dates, expense categories, amounts, or description.
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

            {/* Vehicle Selection */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Select Vehicle / Truck *
              </label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 px-3.5 py-3 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              >
                <option value="">-- Choose Truck --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.truckNo}
                  </option>
                ))}
              </select>
            </div>

            {/* Expense Category */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Expense Category *
              </label>
              <select
                required
                value={expenseCategoryId}
                onChange={(e) => setExpenseCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 px-3.5 py-3 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer"
              >
                <option value="">-- Choose Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Expense Date *
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Amount (AED) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Reference / Bill Number
              </label>
              <input
                type="text"
                placeholder="e.g. Fine Invoice #, Receipt ID"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Description / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add details about the direct vehicle expense..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <Link
                href="/vehicle-expenses"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || deleting}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Details"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
