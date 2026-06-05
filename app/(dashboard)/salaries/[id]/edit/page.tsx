"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Landmark, Calculator, Edit3 } from "lucide-react";

interface Driver {
  name: string;
  advanceBalance: number;
  visaBalance: number;
}

interface SalaryRecord {
  id: string;
  salaryMonth: string;
  basicSalary: number;
  roomRentDeduction: number;
  advanceDeduction: number;
  trafficFineDeduction: number;
  visaDeduction: number;
  otherDeduction: number;
  tripSettlementAdjustment: number;
  paidAmount: number;
  notes: string;
  driver: Driver;
}

export default function EditSalaryPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [salary, setSalary] = useState<SalaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [roomRentDeduction, setRoomRentDeduction] = useState<number>(0);
  const [advanceDeduction, setAdvanceDeduction] = useState<number>(0);
  const [trafficFineDeduction, setTrafficFineDeduction] = useState<number>(0);
  const [visaDeduction, setVisaDeduction] = useState<number>(0);
  const [otherDeduction, setOtherDeduction] = useState<number>(0);
  const [tripSettlementAdjustment, setTripSettlementAdjustment] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/salaries/${id}`);
        if (!res.ok) throw new Error("Salary record not found");
        const data = await res.json();
        setSalary(data);
        setBasicSalary(Number(data.basicSalary));
        setRoomRentDeduction(Number(data.roomRentDeduction));
        setAdvanceDeduction(Number(data.advanceDeduction));
        setTrafficFineDeduction(Number(data.trafficFineDeduction));
        setVisaDeduction(Number(data.visaDeduction));
        setOtherDeduction(Number(data.otherDeduction));
        setTripSettlementAdjustment(Number(data.tripSettlementAdjustment));
        setPaidAmount(Number(data.paidAmount));
        setNotes(data.notes || "");
      } catch (err: any) {
        console.error(err);
        setError("Could not load salary details.");
      } finally {
        setLoading(false);
      }
    };
    fetchSalary();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`/api/salaries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basicSalary,
          roomRentDeduction,
          advanceDeduction,
          trafficFineDeduction,
          visaDeduction,
          otherDeduction,
          tripSettlementAdjustment,
          paidAmount,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update salary slip");

      router.push(`/salaries/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while updating the salary record.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED"
    }).format(val);
  };

  const totalDeductions = roomRentDeduction + advanceDeduction + trafficFineDeduction + visaDeduction + otherDeduction;
  const netSalary = basicSalary + tripSettlementAdjustment - totalDeductions;
  const balance = netSalary - paidAmount;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error && !salary) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="text-rose-500 font-bold">{error}</div>
        <Link href="/salaries" className="text-xs text-emerald-650 hover:underline">
          Back to Salaries
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={`/salaries/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel & Back to Details
        </Link>
      </div>

      {/* Card Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Edit Driver Salary Slip</h1>
              <p className="text-[10px] text-slate-350 font-semibold mt-0.5">
                Update base salary, manual trip settlement adjustments, monthly deductions for {salary?.driver.name}.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          {/* Driver details summary (Read-only) */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/50 p-4 grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
            <div>
              <span className="block text-[10px] text-slate-400">Driver Name</span>
              <span className="text-slate-900">{salary?.driver.name}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Salary Month</span>
              <span className="text-slate-900">{salary?.salaryMonth}</span>
            </div>
          </div>

          {/* Basic Salary & Adjustments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Basic Salary (AED) *
              </label>
              <input
                type="number"
                required
                value={basicSalary}
                onChange={(e) => setBasicSalary(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Trip Settlement Adjustment (+/- AED)
              </label>
              <input
                type="number"
                value={tripSettlementAdjustment}
                onChange={(e) => setTripSettlementAdjustment(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>
          </div>

          {/* Deductions */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Calculator className="h-4 w-4 text-emerald-600" />
              <span>Modify Payroll Deductions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Advance deduction */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Cash Advance Deduction
                </label>
                <input
                  type="number"
                  value={advanceDeduction}
                  onChange={(e) => setAdvanceDeduction(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              {/* Visa deduction */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Visa Installment Dec
                </label>
                <input
                  type="number"
                  value={visaDeduction}
                  onChange={(e) => setVisaDeduction(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              {/* Traffic Fine */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Traffic Fines / Violations
                </label>
                <input
                  type="number"
                  value={trafficFineDeduction}
                  onChange={(e) => setTrafficFineDeduction(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              {/* Room Rent */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Accommodation / Room
                </label>
                <input
                  type="number"
                  value={roomRentDeduction}
                  onChange={(e) => setRoomRentDeduction(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              {/* Other Deduction */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Other Deductions
                </label>
                <input
                  type="number"
                  value={otherDeduction}
                  onChange={(e) => setOtherDeduction(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              {/* Paid Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Paid Amount (Payout)
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Remarks & Transaction Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
            />
          </div>

          {/* Math summary */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs font-semibold text-slate-700">
            <div className="flex justify-between">
              <span>Basic Salary:</span>
              <span className="font-bold text-slate-900">{formatCurrency(basicSalary)}</span>
            </div>
            <div className="flex justify-between">
              <span>Trip Adjustments:</span>
              <span className="text-emerald-700 font-bold">+{formatCurrency(tripSettlementAdjustment)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Deductions:</span>
              <span className="text-rose-600 font-bold">-{formatCurrency(totalDeductions)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-100 text-sm">
              <span>Net Salary Due:</span>
              <span>{formatCurrency(netSalary)}</span>
            </div>
            <div className="flex justify-between text-slate-550 pt-1">
              <span>Paid Amount:</span>
              <span>{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-black text-sm pt-1 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/30">
              <span>Outstanding Carryforward:</span>
              <span>{formatCurrency(balance)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
            <Link
              href={`/salaries/${id}`}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-105 transition cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Payslip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
