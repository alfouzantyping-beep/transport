"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash, RefreshCw, Landmark, AlertTriangle, Calendar, Award, User, Printer } from "lucide-react";
import { format } from "date-fns";

interface Driver {
  id: string;
  name: string;
  mobile: string;
  emiratesId: string;
  passportNo: string;
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
  totalDeduction: number;
  netSalary: number;
  paidAmount: number;
  balance: number;
  status: string;
  notes: string;
  driver: Driver;
}

export default function SalaryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [salary, setSalary] = useState<SalaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const fetchSalary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/salaries/${id}`);
      if (!res.ok) throw new Error("Salary record not found");
      const data = await res.json();
      setSalary(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not load salary details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalary();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this salary sheet? The deductions applied will be added back to the driver's outstanding advance and visa balances. This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const res = await fetch(`/api/salaries/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete salary record");
      }

      router.push("/salaries");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while deleting the salary record.");
      setDeleting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED"
    }).format(val);
  };

  const formatMonth = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return format(date, "MMMM yyyy");
    } catch (e) {
      return monthStr;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !salary) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-900">Failed to load salary record</h3>
        <p className="text-xs text-slate-500 font-semibold">{error || "Salary slip not found."}</p>
        <Link
          href="/salaries"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
        >
          Back to Salaries
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link
          href="/salaries"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Salaries
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/salaries/${id}/edit`}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/50 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5" /> Edit Slip
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/50 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100/60 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <Trash className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Payslip Card container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Company and Slip Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-1">
              GCC TRANSPORT SYSTEM
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Gulf Logistics & Transport Co.</h1>
            <p className="text-[11px] text-slate-450 mt-1 font-medium">Sharjah, UAE | info@gulflotrans.com</p>
          </div>
          <div className="sm:text-right">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-950 text-white mb-2">
              Driver Payslip
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {formatMonth(salary.salaryMonth)}
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">
              Slip Reference: {salary.id.substring(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Driver Details Box */}
        <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
          <div>
            <span className="block text-[10px] text-slate-400">Driver Name</span>
            <span className="text-slate-900">{salary.driver.name}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400">Mobile No.</span>
            <span className="text-slate-900">{salary.driver.mobile || "N/A"}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400">Emirates ID</span>
            <span className="text-slate-900 font-mono">{salary.driver.emiratesId || "N/A"}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400">Passport Number</span>
            <span className="text-slate-900 font-mono">{salary.driver.passportNo || "N/A"}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400">Salary Status</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide mt-0.5 ${
                salary.status === "PAID"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : salary.status === "PARTIAL"
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "bg-rose-50 text-rose-700 border border-rose-100"
              }`}
            >
              {salary.status}
            </span>
          </div>
        </div>

        {/* Earnings vs Deductions Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Earnings Column */}
          <div className="border border-slate-200 rounded-xl p-4 bg-emerald-50/5 space-y-4">
            <h3 className="font-black text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider text-[10px]">
              Earnings & Credits
            </h3>
            <div className="space-y-3 font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span className="text-slate-900 font-bold">{formatCurrency(salary.basicSalary)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Trip Adjustments / Bonus:</span>
                <span>+{formatCurrency(salary.tripSettlementAdjustment)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black border-t border-slate-200 pt-3 text-sm">
                <span>Total Gross Earnings:</span>
                <span>{formatCurrency(salary.basicSalary + salary.tripSettlementAdjustment)}</span>
              </div>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="border border-slate-200 rounded-xl p-4 bg-rose-50/5 space-y-4">
            <h3 className="font-black text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider text-[10px]">
              Payroll Deductions
            </h3>
            <div className="space-y-2.5 font-semibold text-slate-750">
              <div className="flex justify-between">
                <span>Cash Advance Recovery:</span>
                <span className="text-slate-900">{formatCurrency(salary.advanceDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span>Visa Installment:</span>
                <span className="text-slate-900">{formatCurrency(salary.visaDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span>Traffic Fines Penalty:</span>
                <span className="text-slate-900">{formatCurrency(salary.trafficFineDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span>Room / Accommodation Rent:</span>
                <span className="text-slate-900">{formatCurrency(salary.roomRentDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Deductions:</span>
                <span className="text-slate-900">{formatCurrency(salary.otherDeduction)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-black border-t border-slate-200 pt-3 text-sm">
                <span>Total Deductions:</span>
                <span>-{formatCurrency(salary.totalDeduction)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 text-xs font-semibold text-slate-750">
          <div>
            {salary.notes && (
              <div className="max-w-md bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Remarks / Remarks:</span>
                <p className="text-slate-600 leading-normal font-medium">{salary.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-2.5 w-full sm:w-64 text-right">
            <div className="flex justify-between">
              <span>Net Salary Due:</span>
              <span className="text-slate-950 font-bold">{formatCurrency(salary.netSalary)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Paid Amount:</span>
              <span className="font-bold">{formatCurrency(salary.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-black text-sm border-t border-slate-200 pt-2 bg-rose-50/50 p-2 rounded-xl">
              <span>Unpaid Balance:</span>
              <span>{formatCurrency(salary.balance)}</span>
            </div>
          </div>
        </div>

        {/* Printed Footer Signatures */}
        <div className="hidden print:grid grid-cols-2 gap-12 mt-16 text-center text-[10px] text-slate-400 font-bold pt-8 border-t border-slate-100">
          <div>
            <div className="h-12"></div>
            <span className="block border-t border-slate-200 pt-2 w-32 mx-auto">Driver Signature</span>
          </div>
          <div>
            <div className="h-12"></div>
            <span className="block border-t border-slate-200 pt-2 w-32 mx-auto">Manager Seal & Sign</span>
          </div>
        </div>
      </div>
    </div>
  );
}
