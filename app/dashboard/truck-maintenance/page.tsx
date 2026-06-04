"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, Wrench, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Maintenance {
  id: string;
  truckId: string;
  truckNumber: string;
  date: string;
  oilChange: number;
  tyre: number;
  battery: number;
  engineRepair: number;
  brakeRepair: number;
  service: number;
  passing: number;
  insurance: number;
  amount: number;
  workshop: string;
  notes: string;
}

interface Truck {
  id: string;
  truckNumber: string;
}

export default function TruckMaintenancePage() {
  const [logs, setLogs] = useState<Maintenance[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formTruck, setFormTruck] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formWorkshop, setFormWorkshop] = useState("");
  const [formOil, setFormOil] = useState("");
  const [formTyre, setFormTyre] = useState("");
  const [formBattery, setFormBattery] = useState("");
  const [formEngine, setFormEngine] = useState("");
  const [formBrake, setFormBrake] = useState("");
  const [formService, setFormService] = useState("");
  const [formPassing, setFormPassing] = useState("");
  const [formInsurance, setFormInsurance] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [maintRes, trucksRes] = await Promise.all([
        fetch("/api/truck-maintenance"),
        fetch("/api/trucks"),
      ]);

      if (!maintRes.ok || !trucksRes.ok) throw new Error("Failed to load records");

      const maintData = await maintRes.json();
      const trucksData = await trucksRes.json();

      setLogs(maintData.data);
      setTrucks(trucksData.data);
      setLiveDb(maintData.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formTruck || !formDate || !formWorkshop) {
      setFormError("Truck, Date, and Workshop are required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/truck-maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          truckId: formTruck,
          date: formDate,
          oilChange: parseFloat(formOil || "0"),
          tyre: parseFloat(formTyre || "0"),
          battery: parseFloat(formBattery || "0"),
          engineRepair: parseFloat(formEngine || "0"),
          brakeRepair: parseFloat(formBrake || "0"),
          service: parseFloat(formService || "0"),
          passing: parseFloat(formPassing || "0"),
          insurance: parseFloat(formInsurance || "0"),
          workshop: formWorkshop,
          notes: formNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log maintenance");

      const matchingTruck = trucks.find(t => t.id === formTruck);
      const newRecord = {
        ...data.data,
        truckNumber: matchingTruck ? matchingTruck.truckNumber : data.data.truckNumber
      };

      setLogs([newRecord, ...logs]);

      // Reset Form fields
      setFormTruck("");
      setFormDate("");
      setFormWorkshop("");
      setFormOil("");
      setFormTyre("");
      setFormBattery("");
      setFormEngine("");
      setFormBrake("");
      setFormService("");
      setFormPassing("");
      setFormInsurance("");
      setFormNotes("");
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const getPreviewTotal = () => {
    return (
      parseFloat(formOil || "0") +
      parseFloat(formTyre || "0") +
      parseFloat(formBattery || "0") +
      parseFloat(formEngine || "0") +
      parseFloat(formBrake || "0") +
      parseFloat(formService || "0") +
      parseFloat(formPassing || "0") +
      parseFloat(formInsurance || "0")
    );
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.workshop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Truck Maintenance Logs</h1>
          <p className="text-xs text-slate-450 font-semibold">Record vehicle servicing details, oil checks, tire updates, passing/registration fees, and workshop receipts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Log Maintenance
        </button>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">Running in SQLite Database Mode. Logs will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by truck code, workshop name..."
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

      {/* Table */}
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
                  <th className="py-3 px-4">Truck Code</th>
                  <th className="py-3 px-4">Service Date</th>
                  <th className="py-3 px-4 text-right">Oil Change</th>
                  <th className="py-3 px-4 text-right">Tyre / Battery</th>
                  <th className="py-3 px-4 text-right">Engine / Brakes</th>
                  <th className="py-3 px-4 text-right">Total Servicing</th>
                  <th className="py-3 px-4">Workshop</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-450 font-bold">
                      No maintenance records registered.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-900 font-black flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{log.truckNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        {format(new Date(log.date), "dd MMM yyyy")}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-650">{formatCurrency(log.oilChange)}</td>
                      <td className="py-3 px-4 text-right text-slate-650">{formatCurrency(log.tyre + log.battery)}</td>
                      <td className="py-3 px-4 text-right text-slate-650">{formatCurrency(log.engineRepair + log.brakeRepair)}</td>
                      <td className="py-3 px-4 text-right text-slate-900 font-black text-sm">{formatCurrency(log.amount)}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{log.workshop}</td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{log.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900 mb-4">Log Vehicle Maintenance</h2>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-650 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddMaintenance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Select Truck *</label>
                  <select
                    required
                    value={formTruck}
                    onChange={(e) => setFormTruck(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="">Choose Truck Code</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.truckNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Service Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500">Workshop Name *</label>
                  <input
                    type="text"
                    required
                    value={formWorkshop}
                    onChange={(e) => setFormWorkshop(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="Workshop name & location"
                  />
                </div>

                {/* Sub category costs */}
                <div className="col-span-2 border-t border-slate-200 pt-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Servicing Costs breakdown (AED)</h3>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Oil Change</label>
                  <input
                    type="number"
                    value={formOil}
                    onChange={(e) => setFormOil(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2 py-1.5 text-xs text-slate-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Tyre Replacements</label>
                  <input
                    type="number"
                    value={formTyre}
                    onChange={(e) => setFormTyre(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2 py-1.5 text-xs text-slate-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Battery Change</label>
                  <input
                    type="number"
                    value={formBattery}
                    onChange={(e) => setFormBattery(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2 py-1.5 text-xs text-slate-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Engine Diagnostics</label>
                  <input
                    type="number"
                    value={formEngine}
                    onChange={(e) => setFormEngine(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2 py-1.5 text-xs text-slate-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Brakes Overhaul</label>
                  <input
                    type="number"
                    value={formBrake}
                    onChange={(e) => setFormBrake(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2 py-1.5 text-xs text-slate-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase">General Service</label>
                  <input
                    type="number"
                    value={formService}
                    onChange={(e) => setFormService(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2 py-1.5 text-xs text-slate-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase">RTA Passing Fees</label>
                  <input
                    type="number"
                    value={formPassing}
                    onChange={(e) => setFormPassing(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2 py-1.5 text-xs text-slate-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Insurance Premium</label>
                  <input
                    type="number"
                    value={formInsurance}
                    onChange={(e) => setFormInsurance(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2 py-1.5 text-xs text-slate-900"
                    placeholder="0"
                  />
                </div>

                {/* Total Preview */}
                <div className="col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-4 flex justify-between items-center mt-2 font-bold text-sm">
                  <span className="text-slate-550">Total Maintenance Cost:</span>
                  <span className="text-emerald-600 text-lg">{formatCurrency(getPreviewTotal())}</span>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500">Receipt Notes / Repairs description</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 h-16 resize-none"
                    placeholder="Additional repairs description..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
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
                  {submitting ? "Logging..." : "Log Maintenance Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
