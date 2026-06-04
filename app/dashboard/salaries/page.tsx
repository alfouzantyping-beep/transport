"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, Landmark, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface SalaryRecord {
  id: string;
  driverId: string;
  driverName: string;
  month: number;
  year: number;
  baseSalary: number;
  advanceDeduction: number;
  fineDeduction: number;
  visaDeduction: number;
  roomDeduction: number;
  netSalary: number;
  paymentDate: string;
  notes: string;
}

interface Driver {
  id: string;
  name: string;
  salary: number;
  advanceBalance: number;
  visaBalance: number;
}

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formDriver, setFormDriver] = useState("");
  const [formMonth, setFormMonth] = useState(new Date().getMonth() + 1);
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formBase, setFormBase] = useState("");
  const [formAdvanceDec, setFormAdvanceDec] = useState("");
  const [formFineDec, setFormFineDec] = useState("");
  const [formVisaDec, setFormVisaDec] = useState("");
  const [formRoomDec, setFormRoomDec] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salRes, driversRes] = await Promise.all([
        fetch("/api/salaries"),
        fetch("/api/drivers"),
      ]);

      if (!salRes.ok || !driversRes.ok) throw new Error("Failed to load payroll console");

      const salData = await salRes.json();
      const driversData = await driversRes.json();

      setSalaries(salData.data);
      setDrivers(driversData.data);
      setLiveDb(salData.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update base salary and advance balance automatically when driver is selected
  useEffect(() => {
    if (!formDriver) {
      setFormBase("");
      setFormAdvanceDec("");
      setFormVisaDec("");
      return;
    }
    const driver = drivers.find((d) => d.id === formDriver);
    if (driver) {
      setFormBase(driver.salary.toString());
      setFormAdvanceDec(driver.advanceBalance.toString());
      setFormVisaDec(driver.visaBalance.toString());
    }
  }, [formDriver, drivers]);

  const handleProcessSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formDriver || !formBase || !formDate) {
      setFormError("Driver, Base Salary, and Payment Date are required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: formDriver,
          month: formMonth,
          year: formYear,
          baseSalary: parseFloat(formBase),
          advanceDeduction: parseFloat(formAdvanceDec || "0"),
          fineDeduction: parseFloat(formFineDec || "0"),
          visaDeduction: parseFloat(formVisaDec || "0"),
          roomDeduction: parseFloat(formRoomDec || "0"),
          paymentDate: formDate,
          notes: formNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process payroll");

      const matchingDriver = drivers.find(d => d.id === formDriver);
      const newRecord = {
        ...data.data,
        driverName: matchingDriver ? matchingDriver.name : data.data.driverName
      };

      setSalaries([newRecord, ...salaries]);

      // Reset
      setFormDriver("");
      setFormBase("");
      setFormAdvanceDec("");
      setFormFineDec("");
      setFormVisaDec("");
      setFormRoomDec("");
      setFormDate("");
      setFormNotes("");
      setShowModal(false);
      
      // Refresh to update driver outstanding advances
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const getNetSalaryPreview = () => {
    const base = parseFloat(formBase || "0");
    const adv = parseFloat(formAdvanceDec || "0");
    const fine = parseFloat(formFineDec || "0");
    const visa = parseFloat(formVisaDec || "0");
    const room = parseFloat(formRoomDec || "0");
    return base - (adv + fine + visa + room);
  };

  const filteredSalaries = salaries.filter(
    (s) =>
      s.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Monthly Salaries Payroll</h1>
          <p className="text-xs text-slate-450 font-semibold">Calculate driver payslips, deduct cash advances, traffic fines, room rents and process transactions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Process Salary
        </button>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">Running in SQLite Database Mode. Custom payroll slips will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by driver name, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:border-emerald-600 font-medium"
          />
        </div>
        <button
          onClick={fetchData}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-455 bg-slate-50/50">
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Base Salary</th>
                  <th className="py-3 px-4 text-right">Deductions</th>
                  <th className="py-3 px-4 text-right">Net Transferred</th>
                  <th className="py-3 px-4">Processed Date</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredSalaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-450 font-bold">
                      No payroll slip records found.
                    </td>
                  </tr>
                ) : (
                  filteredSalaries.map((s) => {
                    const totalDeductions =
                      s.advanceDeduction + s.fineDeduction + s.visaDeduction + s.roomDeduction;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 text-slate-900 font-black flex items-center gap-1.5">
                          <Landmark className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{s.driverName}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {months[s.month - 1]} {s.year}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700 font-semibold">{formatCurrency(s.baseSalary)}</td>
                        <td className="py-3 px-4 text-right text-red-600 font-semibold">
                          -{formatCurrency(totalDeductions)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-900 font-black text-sm">
                          {formatCurrency(s.netSalary)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {format(new Date(s.paymentDate), "dd MMM yyyy")}
                        </td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{s.notes || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900 mb-4">Process Monthly Driver Salary</h2>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-655 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleProcessSalary} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500">Select Driver *</label>
                  <select
                    required
                    value={formDriver}
                    onChange={(e) => setFormDriver(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="">Choose Driver</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Payroll Month</label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(parseInt(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    {months.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Payroll Year</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(parseInt(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Base Salary (AED) *</label>
                  <input
                    type="number"
                    required
                    value={formBase}
                    onChange={(e) => setFormBase(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>

                {/* Deductions block header */}
                <div className="col-span-2 border-t border-slate-200 pt-2 mt-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deductions</h3>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-550">Advance Balance Dec</label>
                  <input
                    type="number"
                    value={formAdvanceDec}
                    onChange={(e) => setFormAdvanceDec(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-550">Traffic Fines / Challan</label>
                  <input
                    type="number"
                    value={formFineDec}
                    onChange={(e) => setFormFineDec(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-555">Visa / Immigration Cost</label>
                  <input
                    type="number"
                    value={formVisaDec}
                    onChange={(e) => setFormVisaDec(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-550">Accommodation / Room</label>
                  <input
                    type="number"
                    value={formRoomDec}
                    onChange={(e) => setFormRoomDec(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="0"
                  />
                </div>

                {/* Net Salary Preview */}
                <div className="col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-4 flex justify-between items-center mt-2 font-bold text-sm">
                  <span className="text-slate-550">Net Salary to Transfer:</span>
                  <span className="text-emerald-600 text-lg">{formatCurrency(getNetSalaryPreview())}</span>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500">Payment Reference / Remarks</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 h-16 resize-none"
                    placeholder="Transfer receipt transaction ID..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 font-semibold">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:brightness-105 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Settling..." : "Issue Payslip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
