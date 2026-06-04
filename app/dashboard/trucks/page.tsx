"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, Truck, AlertCircle, Edit } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface TruckItem {
  id: string;
  truckNumber: string;
  plateNumber: string;
  trailerNumber: string;
  type: string;
  registrationExpiry: string;
  insuranceExpiry: string;
  assignedDriverId: string | null;
  assignedDriverName: string;
  status: string;
}

interface Driver {
  id: string;
  name: string;
}

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<TruckItem[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState<TruckItem | null>(null);
  
  const [formNumber, setFormNumber] = useState("");
  const [formPlate, setFormPlate] = useState("");
  const [formTrailer, setFormTrailer] = useState("");
  const [formType, setFormType] = useState("Flatbed Trailer");
  const [formRegExpiry, setFormRegExpiry] = useState("");
  const [formInsExpiry, setFormInsExpiry] = useState("");
  const [formDriver, setFormDriver] = useState("");
  const [formStatus, setFormStatus] = useState("AVAILABLE");
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trucksRes, driversRes] = await Promise.all([
        fetch("/api/trucks"),
        fetch("/api/drivers")
      ]);

      if (!trucksRes.ok || !driversRes.ok) throw new Error("Failed to load records");
      
      const trucksData = await trucksRes.json();
      const driversData = await driversRes.json();

      setTrucks(trucksData.data);
      setDrivers(driversData.data);
      setLiveDb(trucksData.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (truck: TruckItem) => {
    setEditingTruck(truck);
    setFormNumber(truck.truckNumber);
    setFormPlate(truck.plateNumber);
    setFormTrailer(truck.trailerNumber || "");
    setFormType(truck.type);
    setFormRegExpiry(truck.registrationExpiry.substring(0, 10));
    setFormInsExpiry(truck.insuranceExpiry.substring(0, 10));
    setFormDriver(truck.assignedDriverId || "");
    setFormStatus(truck.status);
    setFormError("");
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingTruck(null);
    setFormNumber("");
    setFormPlate("");
    setFormTrailer("");
    setFormType("Flatbed Trailer");
    setFormRegExpiry("");
    setFormInsExpiry("");
    setFormDriver("");
    setFormStatus("AVAILABLE");
    setFormError("");
    setShowModal(true);
  };

  const handleSubmitTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formNumber || !formPlate || !formRegExpiry || !formInsExpiry) {
      setFormError("Truck Code, Plate Number, Reg Expiry, and Ins Expiry are required.");
      setSubmitting(false);
      return;
    }

    try {
      const url = editingTruck ? `/api/trucks/${editingTruck.id}` : "/api/trucks";
      const method = editingTruck ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          truckNumber: formNumber,
          plateNumber: formPlate,
          trailerNumber: formTrailer,
          type: formType,
          registrationExpiry: formRegExpiry,
          insuranceExpiry: formInsExpiry,
          assignedDriverId: formDriver || null,
          status: formStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save vehicle");

      // Formatting helper for the assigned driver name
      const matchingDriver = drivers.find(d => d.id === formDriver);
      const updatedItem = {
        ...data.data,
        assignedDriverName: matchingDriver ? matchingDriver.name : "Unassigned"
      };

      if (editingTruck) {
        setTrucks(trucks.map(t => t.id === editingTruck.id ? updatedItem : t));
      } else {
        setTrucks([updatedItem, ...trucks]);
      }
      
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTrucks = trucks.filter(
    (t) =>
      t.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getExpiryAlert = (dateStr: string) => {
    const daysLeft = differenceInDays(new Date(dateStr), new Date());
    if (daysLeft < 0) return { text: "Expired", color: "text-red-650 font-bold" };
    if (daysLeft <= 30) return { text: `Expiring soon (${daysLeft}d)`, color: "text-amber-600 font-bold" };
    return { text: format(new Date(dateStr), "dd MMM yyyy"), color: "text-slate-500 font-medium" };
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Registered Fleet Vehicles</h1>
          <p className="text-xs text-slate-450 font-semibold">Trucks, Tankers and trailers registry</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Register Vehicle
        </button>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">Running in SQLite Database Mode. Custom vehicles will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by truck number, plate code, type..."
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
                  <th className="py-3 px-4">Truck Number</th>
                  <th className="py-3 px-4">Plate Details</th>
                  <th className="py-3 px-4">Trailer / Type</th>
                  <th className="py-3 px-4">Mulkiya Expiry</th>
                  <th className="py-3 px-4">Insurance Expiry</th>
                  <th className="py-3 px-4">Assigned Driver</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredTrucks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-450 font-bold">
                      No vehicles found in registry.
                    </td>
                  </tr>
                ) : (
                  filteredTrucks.map((t) => {
                    const regAlert = getExpiryAlert(t.registrationExpiry);
                    const insAlert = getExpiryAlert(t.insuranceExpiry);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 text-slate-900 font-black flex items-center gap-2">
                          <Truck className="h-4 w-4 text-emerald-600" />
                          <span>{t.truckNumber}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{t.plateNumber}</td>
                        <td className="py-3 px-4 text-slate-650">
                          <div className="font-semibold text-slate-700">{t.type}</div>
                          <div className="text-[10px] text-slate-450">Trailer: {t.trailerNumber || "N/A"}</div>
                        </td>
                        <td className={`py-3 px-4 ${regAlert.color}`}>{regAlert.text}</td>
                        <td className={`py-3 px-4 ${insAlert.color}`}>{insAlert.text}</td>
                        <td className="py-3 px-4 text-slate-750 font-medium">{t.assignedDriverName}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold tracking-wide uppercase ${
                              t.status === "AVAILABLE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : t.status === "IN_TRIP"
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleEditClick(t)}
                            className="rounded-lg p-1 text-slate-450 hover:bg-slate-100 hover:text-emerald-600 transition cursor-pointer"
                            title="Edit Vehicle Details"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
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
            <h2 className="text-lg font-black text-slate-900 mb-4">
              {editingTruck ? `Edit Vehicle: ${editingTruck.truckNumber}` : "Register New Vehicle"}
            </h2>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-650 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitTruck} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Truck ID / Number *</label>
                  <input
                    type="text"
                    required
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="TRK-03-DXB"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Plate Number *</label>
                  <input
                    type="text"
                    required
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="Plate Code & Number"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Trailer License Plate</label>
                  <input
                    type="text"
                    value={formTrailer}
                    onChange={(e) => setFormTrailer(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="Trailer plate #"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Vehicle Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="Flatbed Trailer">Flatbed Trailer</option>
                    <option value="Chemical Tanker">Chemical Tanker</option>
                    <option value="Reefer Trailer">Reefer Trailer</option>
                    <option value="Lowbed Trailer">Lowbed Trailer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Mulkiya Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formRegExpiry}
                    onChange={(e) => setFormRegExpiry(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Insurance Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formInsExpiry}
                    onChange={(e) => setFormInsExpiry(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Assign Driver</label>
                  <select
                    value={formDriver}
                    onChange={(e) => setFormDriver(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="">Unassigned</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Vehicle Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="IN_TRIP">In Trip</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                  </select>
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
                  {submitting ? "Saving..." : editingTruck ? "Save Changes" : "Register Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
