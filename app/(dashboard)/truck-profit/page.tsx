"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw, DollarSign, Calendar, TrendingUp, Truck, User, Building } from "lucide-react";
import { format } from "date-fns";

interface VehicleReport {
  id: string;
  truckNo: string;
  plateNo: string;
  totalTrips: number;
  revenue: number;
  tripExpenses: number;
  vehicleExpenses: number;
  maintenanceCost: number;
  netProfit: number;
}

interface DropdownItem {
  id: string;
  name?: string;
  companyName?: string;
  truckNo?: string;
}

export default function TruckProfitPage() {
  const [reports, setReports] = useState<VehicleReport[]>([]);
  const [vehicles, setVehicles] = useState<DropdownItem[]>([]);
  const [drivers, setDrivers] = useState<DropdownItem[]>([]);
  const [customers, setCustomers] = useState<DropdownItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [vRes, dRes, cRes] = await Promise.all([
          fetch("/api/vehicles"),
          fetch("/api/drivers"),
          fetch("/api/customers")
        ]);

        if (vRes.ok) setVehicles(await vRes.json());
        if (dRes.ok) {
          const resData = await dRes.json();
          setDrivers(resData.data || []);
        }
        if (cRes.ok) {
          const resData = await cRes.json();
          setCustomers(resData.data || []);
        }
      } catch (err) {
        console.error("Failed to load dropdown items", err);
      }
    };
    fetchDropdowns();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/truck-profit", window.location.origin);
      if (startDate) url.searchParams.set("startDate", startDate);
      if (endDate) url.searchParams.set("endDate", endDate);
      if (selectedVehicle) url.searchParams.set("vehicleId", selectedVehicle);
      if (selectedDriver) url.searchParams.set("driverId", selectedDriver);
      if (selectedCustomer) url.searchParams.set("customerId", selectedCustomer);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch profit reports");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, selectedVehicle, selectedDriver, selectedCustomer]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Aggregated totals
  const totalRevenue = reports.reduce((sum, r) => sum + Number(r.revenue), 0);
  const totalTripExpenses = reports.reduce((sum, r) => sum + Number(r.tripExpenses), 0);
  const totalVehicleExpenses = reports.reduce((sum, r) => sum + Number(r.vehicleExpenses), 0);
  const totalMaintenance = reports.reduce((sum, r) => sum + Number(r.maintenanceCost), 0);
  const totalNetProfit = reports.reduce((sum, r) => sum + Number(r.netProfit), 0);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedVehicle("");
    setSelectedDriver("");
    setSelectedCustomer("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Truck Profit Report</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Analyze dynamic, real-time profitability per truck. Formulated as: Revenue - Trip Expenses - Vehicle Expenses - Completed Maintenance.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer w-fit"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" /> Refresh Report
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-slate-500" /> Filter Criteria
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600 transition"
            />
          </div>

          {/* Vehicle Dropdown */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Truck / Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer"
            >
              <option value="">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.truckNo}</option>
              ))}
            </select>
          </div>

          {/* Driver Dropdown */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Driver</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer"
            >
              <option value="">All Drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Customer Dropdown */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Customer</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {(startDate || endDate || selectedVehicle || selectedDriver || selectedCustomer) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Trip Revenue</span>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(totalRevenue)}</h3>
          </div>
        </div>

        {/* Trip Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-xl text-red-500">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Trip Expenses</span>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(totalTripExpenses)}</h3>
          </div>
        </div>

        {/* Vehicle Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-500">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Vehicle Expenses</span>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(totalVehicleExpenses)}</h3>
          </div>
        </div>

        {/* Maintenance cost */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 rounded-xl text-teal-500">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Maintenance Cost</span>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(totalMaintenance)}</h3>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`bg-white rounded-2xl border p-4 shadow-sm flex items-center gap-3 ${totalNetProfit >= 0 ? "border-emerald-250 bg-emerald-50/10" : "border-red-250 bg-red-50/10"}`}>
          <div className={`p-2.5 rounded-xl ${totalNetProfit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Net profit</span>
            <h3 className={`text-sm font-black mt-0.5 ${totalNetProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(totalNetProfit)}</h3>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="py-4 px-5">Truck / Plate No</th>
                  <th className="py-4 px-5 text-center">Trips</th>
                  <th className="py-4 px-5 text-right">Trip Revenue (+)</th>
                  <th className="py-4 px-5 text-right">Trip Expenses (-)</th>
                  <th className="py-4 px-5 text-right">Vehicle Expenses (-)</th>
                  <th className="py-4 px-5 text-right">Maintenance (-)</th>
                  <th className="py-4 px-5 text-right">Net Profit (=)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      No matching truck data found.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/40 transition duration-150">
                      <td className="py-3.5 px-5">
                        <span className="text-slate-900 font-black">{report.truckNo}</span>
                        <div className="text-[10px] text-slate-500 font-semibold">{report.plateNo}</div>
                      </td>
                      <td className="py-3.5 px-5 text-center text-slate-700">{report.totalTrips}</td>
                      <td className="py-3.5 px-5 text-right text-slate-900 font-bold">{formatCurrency(report.revenue)}</td>
                      <td className="py-3.5 px-5 text-right text-slate-500 font-medium">{formatCurrency(report.tripExpenses)}</td>
                      <td className="py-3.5 px-5 text-right text-slate-500 font-medium">{formatCurrency(report.vehicleExpenses)}</td>
                      <td className="py-3.5 px-5 text-right text-slate-500 font-medium">{formatCurrency(report.maintenanceCost)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <span className={`font-black text-sm ${report.netProfit >= 0 ? "text-emerald-600" : "text-red-650"}`}>
                          {formatCurrency(report.netProfit)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
