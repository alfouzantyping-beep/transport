"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, Navigation, AlertCircle, Edit } from "lucide-react";

interface Trip {
  id: string;
  tripNumber: string;
  customerId: string;
  customerName: string;
  driverId: string;
  driverName: string;
  truckId: string;
  truckNumber: string;
  fromCountry: string;
  toCountry: string;
  loadingPoint: string;
  deliveryPoint: string;
  doNumber: string;
  cargoType: string;
  tripAmount: number;
  status: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Driver {
  id: string;
  name: string;
}

interface Truck {
  id: string;
  truckNumber: string;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [formCustomer, setFormCustomer] = useState("");
  const [formDriver, setFormDriver] = useState("");
  const [formTruck, setFormTruck] = useState("");
  const [formFromCountry, setFormFromCountry] = useState("UAE");
  const [formToCountry, setFormToCountry] = useState("Saudi Arabia");
  const [formLoadingPoint, setFormLoadingPoint] = useState("");
  const [formDeliveryPoint, setFormDeliveryPoint] = useState("");
  const [formDoNumber, setFormDoNumber] = useState("");
  const [formCargoType, setFormCargoType] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStatus, setFormStatus] = useState("LOADING");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripsRes, custRes, drvRes, trkRes] = await Promise.all([
        fetch("/api/trips"),
        fetch("/api/customers"),
        fetch("/api/drivers"),
        fetch("/api/trucks"),
      ]);

      if (!tripsRes.ok) throw new Error("Failed to load trips");
      
      const tripsData = await tripsRes.json();
      const custData = await custRes.json();
      const drvData = await drvRes.json();
      const trkData = await trkRes.json();

      setTrips(tripsData.data);
      setCustomers(custData.data);
      setDrivers(drvData.data);
      setTrucks(trkData.data);
      setLiveDb(tripsData.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (trip: Trip) => {
    setEditingTrip(trip);
    setFormCustomer(trip.customerId);
    setFormDriver(trip.driverId);
    setFormTruck(trip.truckId);
    setFormFromCountry(trip.fromCountry);
    setFormToCountry(trip.toCountry);
    setFormLoadingPoint(trip.loadingPoint || "");
    setFormDeliveryPoint(trip.deliveryPoint || "");
    setFormDoNumber(trip.doNumber || "");
    setFormCargoType(trip.cargoType || "");
    setFormAmount(trip.tripAmount.toString());
    setFormStatus(trip.status);
    setFormError("");
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingTrip(null);
    setFormCustomer("");
    setFormDriver("");
    setFormTruck("");
    setFormFromCountry("UAE");
    setFormToCountry("Saudi Arabia");
    setFormLoadingPoint("");
    setFormDeliveryPoint("");
    setFormDoNumber("");
    setFormCargoType("");
    setFormAmount("");
    setFormStatus("LOADING");
    setFormError("");
    setShowModal(true);
  };

  const handleSubmitTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formCustomer || !formDriver || !formTruck || !formFromCountry || !formToCountry || !formAmount) {
      setFormError("Please fill in all required fields marked with *.");
      setSubmitting(false);
      return;
    }

    try {
      const url = editingTrip ? `/api/trips/${editingTrip.id}` : "/api/trips";
      const method = editingTrip ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formCustomer,
          driverId: formDriver,
          truckId: formTruck,
          fromCountry: formFromCountry,
          toCountry: formToCountry,
          loadingPoint: formLoadingPoint,
          deliveryPoint: formDeliveryPoint,
          doNumber: formDoNumber,
          cargoType: formCargoType,
          tripAmount: parseFloat(formAmount),
          status: formStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save trip");

      if (editingTrip) {
        setTrips(trips.map(t => t.id === editingTrip.id ? data.data : t));
      } else {
        setTrips([data.data, ...trips]);
      }
      
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTrips = trips.filter(
    (t) =>
      t.tripNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.doNumber.includes(searchQuery)
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  const countries = ["UAE", "Saudi Arabia", "Qatar", "Oman", "Kuwait"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Trips Logging Board</h1>
          <p className="text-xs text-slate-450 font-semibold">Create, monitor and close active transportation jobs</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Book New Trip
        </button>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-medium">Running in SQLite Database Mode. Custom trips will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Search & Refresh */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by trip number, customer, driver, DO..."
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
                  <th className="py-3 px-4">Trip Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Driver & Vehicle</th>
                  <th className="py-3 px-4">Route Details</th>
                  <th className="py-3 px-4">DO & Cargo</th>
                  <th className="py-3 px-4 text-right">Freight Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-450 font-bold">
                      No active or previous trip logs found.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-900 font-black flex items-center gap-1.5">
                        <Navigation className="h-3.5 w-3.5 text-emerald-600 rotate-45" />
                        <span>{t.tripNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">{t.customerName}</td>
                      <td className="py-3 px-4 text-slate-650">
                        <div className="font-bold text-slate-700">{t.driverName}</div>
                        <div className="text-[10px] text-slate-400">{t.truckNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-650">
                        <div>{t.fromCountry} ➔ {t.toCountry}</div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {t.loadingPoint} ➔ {t.deliveryPoint}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-mono text-[10px] text-slate-700">DO: {t.doNumber || "N/A"}</div>
                        <div className="text-[10px] text-slate-400">{t.cargoType}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">{formatCurrency(t.tripAmount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold tracking-wide uppercase ${
                            t.status === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : t.status === "IN_TRANSIT"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : t.status === "LOADING"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleEditClick(t)}
                          className="rounded-lg p-1 text-slate-450 hover:bg-slate-100 hover:text-emerald-600 transition cursor-pointer"
                          title="Edit Trip Details"
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

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900 mb-4">
              {editingTrip ? `Edit Journey: ${editingTrip.tripNumber}` : "Book New Journey / Trip"}
            </h2>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-650 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitTrip} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Master Links */}
                <div>
                  <label className="text-xs font-bold text-slate-500">Select Customer *</label>
                  <select
                    required
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="">Choose Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
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
                  <label className="text-xs font-bold text-slate-500">Select Truck *</label>
                  <select
                    required
                    value={formTruck}
                    onChange={(e) => setFormTruck(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="">Choose Vehicle</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.truckNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Freight Amount */}
                <div>
                  <label className="text-xs font-bold text-slate-500">Trip Freight Amount (AED) *</label>
                  <input
                    type="number"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="e.g. 7500"
                  />
                </div>

                {/* Countries */}
                <div>
                  <label className="text-xs font-bold text-slate-500">Loading Country *</label>
                  <select
                    value={formFromCountry}
                    onChange={(e) => setFormFromCountry(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Destination Country *</label>
                  <select
                    value={formToCountry}
                    onChange={(e) => setFormToCountry(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Loading and Delivery Points */}
                <div>
                  <label className="text-xs font-bold text-slate-500">Loading Point</label>
                  <input
                    type="text"
                    value={formLoadingPoint}
                    onChange={(e) => setFormLoadingPoint(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="e.g. Jebel Ali Port"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Delivery Point</label>
                  <input
                    type="text"
                    value={formDeliveryPoint}
                    onChange={(e) => setFormDeliveryPoint(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="e.g. Riyadh Depot"
                  />
                </div>

                {/* DO and Cargo */}
                <div>
                  <label className="text-xs font-bold text-slate-500">Delivery Order (DO) Number</label>
                  <input
                    type="text"
                    value={formDoNumber}
                    onChange={(e) => setFormDoNumber(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="DO-xxxxx"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Cargo Type</label>
                  <input
                    type="text"
                    value={formCargoType}
                    onChange={(e) => setFormCargoType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="e.g. Chemical Tank / Steel"
                  />
                </div>

                {/* Initial Status */}
                <div>
                  <label className="text-xs font-bold text-slate-500">Trip Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="LOADING">Loading</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="DELIVERED">Delivered (Completed)</option>
                    <option value="CANCELLED">Cancelled</option>
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
                  {submitting ? "Saving..." : editingTrip ? "Save Changes" : "Create Journey Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
