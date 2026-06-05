"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Landmark, Calendar, User, DollarSign, Calculator } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  basicSalary: number;
  salary: number; // fallback
  advanceBalance: number;
  visaBalance: number;
}

export default function CreateSalaryPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [roomRentDeduction, setRoomRentDeduction] = useState<number>(0);
  const [advanceDeduction, setAdvanceDeduction] = useState<number>(0);
  const [trafficFineDeduction, setTrafficFineDeduction] = useState<number>(0);
  const [visaDeduction, setVisaDeduction] = useState<number>(0);
  const [otherDeduction, setOtherDeduction] = useState<number>(0);
  const [tripSettlementAdjustment, setTripSettlementAdjustment] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Profile data of selected driver
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/drivers");
        if (!res.ok) throw new Error("Failed to fetch drivers");
        const data = await res.json();
        setDrivers(data.data || []);
      } catch (err: any) {
        console.error(err);
        setError("Could not load driver profiles.");
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  // Autofill driver info when selected
  useEffect(() => {
    const driver = drivers.find((d) => d.id === selectedDriverId) || null;
    setSelectedDriver(driver);
    if (driver) {
      const basic = Number(driver.basicSalary || driver.salary || 0);
      setBasicSalary(basic);
      setAdvanceDeduction(Number(driver.advanceBalance || 0));
      setVisaDeduction(Number(driver.visaBalance || 0));
      // Reset other parameters
      setRoomRentDeduction(0);
      setTrafficFineDeduction(0);
      setOtherDeduction(0);
      setTripSettlementAdjustment(0);
      setPaidAmount(0);
    } else {
      setBasicSalary(0);
      setAdvanceDeduction(0);
      setVisaDeduction(0);
    }
  }, [selectedDriverId, drivers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !salaryMonth) {
      setError("Driver and salary month are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriverId,
          salaryMonth,
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
      if (!res.ok) throw new Error(data.error || "Failed to create salary slip");

      router.push(`/salaries/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while creating the salary record.");
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

  // Calculations
  const totalDeductions = roomRentDeduction + advanceDeduction + trafficFineDeduction + visaDeduction + otherDeduction;
  const netSalary = basicSalary + tripSettlementAdjustment - totalDeductions;
  const balance = netSalary - paidAmount;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/salaries"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Salaries
        </Link>
      </div>

      {/* Card Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Process Monthly Salary</h1>
              <p className="text-[10px] text-slate-300 font-semibold mt-0.5">
                Generate monthly payslips, manage cash advance balances, fines, visa deductions, and bank payouts.
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

            {/* Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Driver */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Select Driver *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-405" />
                  <select
                    required
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Month */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Salary Month (YYYY-MM) *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-405" />
                  <input
                    type="month"
                    required
                    value={salaryMonth}
                    onChange={(e) => setSalaryMonth(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
              </div>
            </div>

            {/* Basic Salary & Manual Trip Settlement Adjustments */}
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
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
                  placeholder="e.g. 500 or -200"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>
            </div>

            {/* Deductions Header */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Calculator className="h-4 w-4 text-emerald-600" />
                <span>Monthly Payroll Deductions</span>
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
                  {selectedDriver && (
                    <span className="block text-[9px] text-slate-400 mt-1 font-semibold">
                      Max available: {formatCurrency(selectedDriver.advanceBalance)}
                    </span>
                  )}
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
                  {selectedDriver && (
                    <span className="block text-[9px] text-slate-400 mt-1 font-semibold">
                      Max available: {formatCurrency(selectedDriver.visaBalance)}
                    </span>
                  )}
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
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
                    Paid Amount (This Payout)
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
                Payroll Slips Notes /Remarks
              </label>
              <textarea
                rows={2}
                placeholder="Include transaction notes, bank transfer reference, cheque number..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-955 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            {/* Mathematical Summary preview */}
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
                <span>Carryforward Balance (Unpaid):</span>
                <span>{formatCurrency(balance)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <Link
                href="/salaries"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !selectedDriverId}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-105 hover:shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Generate Payslip"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
