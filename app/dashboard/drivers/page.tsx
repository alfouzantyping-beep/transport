"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, AlertCircle, Edit } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  mobile: string;
  passport: string;
  emiratesId: string;
  license: string;
  salary: number;
  advanceBalance: number;
  visaBalance: number;
  status: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formPassport, setFormPassport] = useState("");
  const [formEmiratesId, setFormEmiratesId] = useState("");
  const [formLicense, setFormLicense] = useState("");
  const [formSalary, setFormSalary] = useState("");
  const [formAdvanceBalance, setFormAdvanceBalance] = useState("0");
  const [formVisaBalance, setFormVisaBalance] = useState("0");
  const [formStatus, setFormStatus] = useState("AVAILABLE");
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/drivers");
      if (!res.ok) throw new Error("Failed to fetch drivers");
      const data = await res.json();
      setDrivers(data.data);
      setLiveDb(data.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleEditClick = (driver: Driver) => {
    setEditingDriver(driver);
    setFormName(driver.name);
    setFormMobile(driver.mobile);
    setFormPassport(driver.passport);
    setFormEmiratesId(driver.emiratesId);
    setFormLicense(driver.license);
    setFormSalary(driver.salary.toString());
    setFormAdvanceBalance(driver.advanceBalance.toString());
    setFormVisaBalance(driver.visaBalance.toString());
    setFormStatus(driver.status);
    setFormError("");
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingDriver(null);
    setFormName("");
    setFormMobile("");
    setFormPassport("");
    setFormEmiratesId("");
    setFormLicense("");
    setFormSalary("");
    setFormAdvanceBalance("0");
    setFormVisaBalance("0");
    setFormStatus("AVAILABLE");
    setFormError("");
    setShowModal(true);
  };

  const handleSubmitDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formName || !formMobile || !formLicense || !formSalary) {
      setFormError("Name, Mobile, License, and Salary are required.");
      setSubmitting(false);
      return;
    }

    try {
      const url = editingDriver ? `/api/drivers/${editingDriver.id}` : "/api/drivers";
      const method = editingDriver ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          mobile: formMobile,
          passport: formPassport,
          emiratesId: formEmiratesId,
          license: formLicense,
          salary: parseFloat(formSalary),
          advanceBalance: parseFloat(formAdvanceBalance || "0"),
          visaBalance: parseFloat(formVisaBalance || "0"),
          status: formStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save driver profile");

      if (editingDriver) {
        setDrivers(drivers.map(d => d.id === editingDriver.id ? data.data : d));
      } else {
        setDrivers([data.data, ...drivers]);
      }
      
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.mobile.includes(searchQuery) ||
      d.emiratesId.includes(searchQuery)
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
      {/* Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Registered Drivers</h1>
          <p className="text-xs text-slate-450 font-semibold">Logistics operations team and payroll profiles</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Register Driver
        </button>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Running in SQLite Database Mode. Custom drivers will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, Emirates ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:border-emerald-600 font-medium"
          />
        </div>
        <button
          onClick={fetchDrivers}
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
                  <th className="py-3 px-4">Mobile & License</th>
                  <th className="py-3 px-4">Government IDs</th>
                  <th className="py-3 px-4 text-right">Basic Salary</th>
                  <th className="py-3 px-4 text-right">Cash Advances</th>
                  <th className="py-3 px-4 text-right">Visa Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-450 font-bold">
                      No driver profiles registered.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-900 font-black">{d.name}</td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-bold">{d.mobile}</div>
                        <div className="text-[10px] text-slate-450">{d.license}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono space-y-0.5">
                        <div>EID: {d.emiratesId || "-"}</div>
                        <div className="text-[10px] text-slate-455">PPT: {d.passport || "-"}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">{formatCurrency(d.salary)}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">{formatCurrency(d.advanceBalance)}</td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-650">{formatCurrency(d.visaBalance)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold tracking-wide uppercase ${
                            d.status === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : d.status === "ACTIVE"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleEditClick(d)}
                          className="rounded-lg p-1 text-slate-450 hover:bg-slate-100 hover:text-emerald-600 transition cursor-pointer"
                          title="Edit Driver Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
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
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900 mb-4">
              {editingDriver ? `Edit Driver: ${editingDriver.name}` : "Register New Driver"}
            </h2>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-650 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitDriver} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500">Driver Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="Muhammad Ali"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="+971 5x xxx xxxx"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Driving License Number *</label>
                  <input
                    type="text"
                    required
                    value={formLicense}
                    onChange={(e) => setFormLicense(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="Heavy Truck Category"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Passport Number</label>
                  <input
                    type="text"
                    value={formPassport}
                    onChange={(e) => setFormPassport(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="Passport #"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Emirates ID</label>
                  <input
                    type="text"
                    value={formEmiratesId}
                    onChange={(e) => setFormEmiratesId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="784-xxxx-xxxxxxx-x"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Monthly Basic Salary (AED) *</label>
                  <input
                    type="number"
                    required
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="e.g. 4500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="ACTIVE">Active in Trip</option>
                    <option value="OFF_DUTY">Off Duty</option>
                  </select>
                </div>

                {editingDriver && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-500">Advance Balance (AED)</label>
                      <input
                        type="number"
                        value={formAdvanceBalance}
                        onChange={(e) => setFormAdvanceBalance(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-550">Visa Balance (AED)</label>
                      <input
                        type="number"
                        value={formVisaBalance}
                        onChange={(e) => setFormVisaBalance(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                      />
                    </div>
                  </>
                )}
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
                  {submitting ? "Saving..." : editingDriver ? "Save Changes" : "Register Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
