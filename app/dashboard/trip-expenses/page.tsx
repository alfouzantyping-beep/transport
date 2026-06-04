"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, AlertCircle, Coins } from "lucide-react";

interface Expense {
  id: string;
  tripId: string;
  tripNumber: string;
  driverName: string;
  // 15 Excel categories
  qatarVisa: number;
  qatarToll: number;
  ksaVisa: number;
  uaeCustoms: number;
  ksaCustoms: number;
  mezan: number;
  jordanBorder: number;
  cameraFine: number;
  hayaPeshgi: number;
  toll: number;
  gatePass: number;
  diesel: number;
  food: number;
  border: number;
  maintenance: number;
  notes: string;
}

interface Trip {
  id: string;
  tripNumber: string;
  driverName: string;
}

export default function TripExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);

  // Form State for 15 granular items
  const [showModal, setShowModal] = useState(false);
  const [formTrip, setFormTrip] = useState("");
  const [formQatarVisa, setFormQatarVisa] = useState("");
  const [formQatarToll, setFormQatarToll] = useState("");
  const [formKsaVisa, setFormKsaVisa] = useState("");
  const [formUaeCustoms, setFormUaeCustoms] = useState("");
  const [formKsaCustoms, setFormKsaCustoms] = useState("");
  const [formMezan, setFormMezan] = useState("");
  const [formJordanBorder, setFormJordanBorder] = useState("");
  const [formCameraFine, setFormCameraFine] = useState("");
  const [formHayaPeshgi, setFormHayaPeshgi] = useState("");
  const [formToll, setFormToll] = useState("");
  const [formGatePass, setFormGatePass] = useState("");
  const [formDiesel, setFormDiesel] = useState("");
  const [formFood, setFormFood] = useState("");
  const [formBorder, setFormBorder] = useState("");
  const [formMaintenance, setFormMaintenance] = useState("");
  const [formNotes, setFormNotes] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, tripsRes] = await Promise.all([
        fetch("/api/trips/expenses"),
        fetch("/api/trips"),
      ]);

      if (!expRes.ok || !tripsRes.ok) throw new Error("Failed to load records");

      const expData = await expRes.json();
      const tripsData = await tripsRes.json();

      setExpenses(expData.data);
      setTrips(tripsData.data);
      setLiveDb(expData.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpenses = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formTrip) {
      setFormError("Trip selection is required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/trips/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: formTrip,
          qatarVisa: parseFloat(formQatarVisa || "0"),
          qatarToll: parseFloat(formQatarToll || "0"),
          ksaVisa: parseFloat(formKsaVisa || "0"),
          uaeCustoms: parseFloat(formUaeCustoms || "0"),
          ksaCustoms: parseFloat(formKsaCustoms || "0"),
          mezan: parseFloat(formMezan || "0"),
          jordanBorder: parseFloat(formJordanBorder || "0"),
          cameraFine: parseFloat(formCameraFine || "0"),
          hayaPeshgi: parseFloat(formHayaPeshgi || "0"),
          toll: parseFloat(formToll || "0"),
          gatePass: parseFloat(formGatePass || "0"),
          diesel: parseFloat(formDiesel || "0"),
          food: parseFloat(formFood || "0"),
          border: parseFloat(formBorder || "0"),
          maintenance: parseFloat(formMaintenance || "0"),
          notes: formNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log expenses");

      const matchingTrip = trips.find(t => t.id === formTrip);
      const newRecord = {
        ...data.data,
        tripNumber: matchingTrip ? matchingTrip.tripNumber : data.data.tripNumber,
        driverName: matchingTrip ? matchingTrip.driverName : "N/A"
      };

      setExpenses([newRecord, ...expenses]);

      // Reset Form fields
      setFormTrip("");
      setFormQatarVisa("");
      setFormQatarToll("");
      setFormKsaVisa("");
      setFormUaeCustoms("");
      setFormKsaCustoms("");
      setFormMezan("");
      setFormJordanBorder("");
      setFormCameraFine("");
      setFormHayaPeshgi("");
      setFormToll("");
      setFormGatePass("");
      setFormDiesel("");
      setFormFood("");
      setFormBorder("");
      setFormMaintenance("");
      setFormNotes("");
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.tripNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  const calculateTotal = (e: Expense) => {
    return (
      (e.qatarVisa || 0) +
      (e.qatarToll || 0) +
      (e.ksaVisa || 0) +
      (e.uaeCustoms || 0) +
      (e.ksaCustoms || 0) +
      (e.mezan || 0) +
      (e.jordanBorder || 0) +
      (e.cameraFine || 0) +
      (e.hayaPeshgi || 0) +
      (e.toll || 0) +
      (e.gatePass || 0) +
      (e.diesel || 0) +
      (e.food || 0) +
      (e.border || 0) +
      (e.maintenance || 0)
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Trip Expenses Logging</h1>
          <p className="text-xs text-slate-450 font-semibold">Record all trip-related road expenses (Visa, Custom, Mezan, Diesel, Toll Gates etc)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Log Trip Expenses
        </button>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">Running in SQLite Database Mode. Expenses will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by trip number..."
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
                  <th className="py-3 px-4">Trip Code</th>
                  <th className="py-3 px-4 text-right">Diesel</th>
                  <th className="py-3 px-4 text-right">Food</th>
                  <th className="py-3 px-4 text-right">Border (Broder)</th>
                  <th className="py-3 px-4 text-right">Toll Gate</th>
                  <th className="py-3 px-4 text-right">Customs (UAE+KSA)</th>
                  <th className="py-3 px-4 text-right">Visa (Qatar+KSA)</th>
                  <th className="py-3 px-4 text-right text-rose-700">Camera Fine</th>
                  <th className="py-3 px-4 text-right">Total Expenses</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-450 font-bold">
                      No expense logs found.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const totalCustoms = Number(exp.uaeCustoms || 0) + Number(exp.ksaCustoms || 0);
                    const totalVisas = Number(exp.qatarVisa || 0) + Number(exp.ksaVisa || 0);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 text-slate-900 font-black">{exp.tripNumber}</td>
                        <td className="py-3 px-4 text-right text-slate-700 font-semibold">{formatCurrency(exp.diesel || 0)}</td>
                        <td className="py-3 px-4 text-right text-slate-700 font-semibold">{formatCurrency(exp.food || 0)}</td>
                        <td className="py-3 px-4 text-right text-slate-700 font-semibold">{formatCurrency(exp.border || 0)}</td>
                        <td className="py-3 px-4 text-right text-slate-700 font-semibold">{formatCurrency(exp.toll || 0)}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(totalCustoms)}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(totalVisas)}</td>
                        <td className="py-3 px-4 text-right text-rose-600 font-bold">{formatCurrency(exp.cameraFine || 0)}</td>
                        <td className="py-3 px-4 text-right text-slate-900 font-black text-sm">
                          {formatCurrency(calculateTotal(exp))}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium truncate max-w-xs">{exp.notes || "-"}</td>
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
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900">Log Trip Expenses</h2>
            </div>
            <p className="text-xs text-slate-400 font-bold mb-4 uppercase tracking-wider">GCC Operational Micro Expenditures Sheet</p>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-655 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddExpenses} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Select Active Trip *</label>
                <select
                  required
                  value={formTrip}
                  onChange={(e) => setFormTrip(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-black"
                >
                  <option value="">Choose Trip Code</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber} ({t.driverName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expense Category Fields Grid matching Excel */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-b border-slate-150 py-4">
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">Qatar Visa</label>
                  <input
                    type="number"
                    value={formQatarVisa}
                    onChange={(e) => setFormQatarVisa(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">Qatar Ins</label>
                  <input
                    type="number"
                    value={formQatarToll}
                    onChange={(e) => setFormQatarToll(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase">KSA Visa</label>
                  <input
                    type="number"
                    value={formKsaVisa}
                    onChange={(e) => setFormKsaVisa(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">UAE Custom</label>
                  <input
                    type="number"
                    value={formUaeCustoms}
                    onChange={(e) => setFormUaeCustoms(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">KSA Custom</label>
                  <input
                    type="number"
                    value={formKsaCustoms}
                    onChange={(e) => setFormKsaCustoms(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">Mezan</label>
                  <input
                    type="number"
                    value={formMezan}
                    onChange={(e) => setFormMezan(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase">Jordan Border</label>
                  <input
                    type="number"
                    value={formJordanBorder}
                    onChange={(e) => setFormJordanBorder(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-rose-700 uppercase">Camra X</label>
                  <input
                    type="number"
                    value={formCameraFine}
                    onChange={(e) => setFormCameraFine(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-rose-700 font-semibold focus:border-rose-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">Haya/Peshgi</label>
                  <input
                    type="number"
                    value={formHayaPeshgi}
                    onChange={(e) => setFormHayaPeshgi(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">Toll Gate</label>
                  <input
                    type="number"
                    value={formToll}
                    onChange={(e) => setFormToll(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">Gate Pass</label>
                  <input
                    type="number"
                    value={formGatePass}
                    onChange={(e) => setFormGatePass(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">Diesel</label>
                  <input
                    type="number"
                    value={formDiesel}
                    onChange={(e) => setFormDiesel(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase">Food</label>
                  <input
                    type="number"
                    value={formFood}
                    onChange={(e) => setFormFood(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">Broder</label>
                  <input
                    type="number"
                    value={formBorder}
                    onChange={(e) => setFormBorder(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase">Mainteance</label>
                  <input
                    type="number"
                    value={formMaintenance}
                    onChange={(e) => setFormMaintenance(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 font-semibold"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Expense Notes / Remarks</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 h-16 resize-none font-medium"
                  placeholder="Details of expense receipts..."
                />
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
                  {submitting ? "Saving..." : "Log Expenses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
