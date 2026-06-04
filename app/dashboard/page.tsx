"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  Users,
  Navigation,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ExternalLink
} from "lucide-react";

interface Stats {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  fleetUtilization: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  driversCount: number;
  availableDrivers: number;
  trucksCount: number;
  availableTrucks: number;
}

interface RecentTrip {
  id: string;
  tripNumber: string;
  customer: string;
  driver: string;
  truck: string;
  route: string;
  amount: number;
  status: string;
}

interface CountryVolume {
  name: string;
  value: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [countryVolume, setCountryVolume] = useState<CountryVolume[]>([]);
  const [liveDb, setLiveDb] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to load dashboard statistics");
      const data = await res.json();
      setStats(data.stats);
      setRecentTrips(data.recentTrips);
      setCountryVolume(data.countryVolume);
      setLiveDb(data.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500 font-semibold">Loading GCC ERP Console...</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* DB Warning Alert Banner */}
      {!liveDb && (
        <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800 shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm font-medium">
            <span className="font-bold">Local SQLite database is active!</span> Seeding is successful. Real data is loaded locally from your <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs text-slate-700">dev.db</code> SQLite file.
          </div>
          <button 
            onClick={fetchDashboardData} 
            disabled={refreshing}
            className="ml-auto rounded-lg bg-amber-100 hover:bg-amber-200 px-3 py-1.5 text-xs font-bold text-amber-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} /> Sync Status
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-emerald-600 to-teal-650 p-6 rounded-2xl shadow-sm text-white border border-emerald-500/10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">GCC Fleet Operations</h1>
          <p className="text-xs text-emerald-100 font-semibold">Real-time status updates across UAE, KSA, Qatar, Oman, and Kuwait corridors</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/trips"
            className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-emerald-700 hover:bg-slate-50 shadow-sm hover:shadow transition cursor-pointer"
          >
            Create New Trip <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Revenue */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalRevenue)}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">AED invoiced values</p>
            </div>
          </div>

          {/* Expenses */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trip Expenses</span>
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalExpenses)}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Fuel, border fees & custom clearing</p>
            </div>
          </div>

          {/* Net Profit */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profit margin</span>
              <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats.netProfit)}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                Margin: {stats.totalRevenue > 0 ? Math.round((stats.netProfit / stats.totalRevenue) * 100) : 0}% of sales
              </p>
            </div>
          </div>

          {/* Fleet Utilization */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Utilization</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-650">
                <Truck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">{stats.fleetUtilization}%</h3>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full" 
                  style={{ width: `${stats.fleetUtilization}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Details & Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Recent Active Trips */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Recent Active Trips</h2>
              <p className="text-xs text-slate-400 font-semibold">Live monitoring of shipments</p>
            </div>
            <Link 
              href="/dashboard/trips"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
            >
              Manage Trips <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-450 bg-slate-50/50">
                  <th className="py-2.5 pl-2">Trip ID</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Driver & Truck</th>
                  <th className="py-2.5">Route</th>
                  <th className="py-2.5 text-right">Freight</th>
                  <th className="py-2.5 pr-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                      No active trips registered yet.
                    </td>
                  </tr>
                ) : (
                  recentTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 pl-2 font-bold text-slate-800">{trip.tripNumber}</td>
                      <td className="py-3 text-slate-900 font-semibold">{trip.customer}</td>
                      <td className="py-3 text-slate-650">
                        <div className="font-bold text-slate-700">{trip.driver}</div>
                        <div className="text-[10px] text-slate-450">{trip.truck}</div>
                      </td>
                      <td className="py-3 text-slate-700 font-bold">{trip.route}</td>
                      <td className="py-3 text-right font-black text-slate-900">{formatCurrency(trip.amount)}</td>
                      <td className="py-3 pr-2 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold tracking-wide uppercase ${
                            trip.status === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : trip.status === "IN_TRANSIT"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : trip.status === "LOADING"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {trip.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side: Operations Health / Quick Registry */}
        <div className="space-y-6">
          {/* Operations Health Status Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900">Operations Health</h2>
              <p className="text-xs text-slate-400 font-semibold">Available drivers and vehicles</p>
            </div>
            
            {stats && (
              <div className="space-y-4">
                {/* Drivers Status */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 flex items-center gap-1.5"><Users className="h-4 w-4 text-slate-400" /> Drivers Available</span>
                    <span className="font-bold text-slate-800">{stats.availableDrivers} / {stats.driversCount}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full" 
                      style={{ width: `${stats.driversCount > 0 ? (stats.availableDrivers / stats.driversCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Trucks Status */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 flex items-center gap-1.5"><Truck className="h-4 w-4 text-slate-400" /> Vehicles Available</span>
                    <span className="font-bold text-slate-800">{stats.availableTrucks} / {stats.trucksCount}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{ width: `${stats.trucksCount > 0 ? (stats.availableTrucks / stats.trucksCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Regional Breakdown Progress Bars */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900">Regional Trip Volume</h2>
              <p className="text-xs text-slate-400 font-semibold">Distribution across GCC corridors</p>
            </div>

            <div className="space-y-3">
              {countryVolume.map((country, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>{country.name}</span>
                    <span>{country.value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-500 h-1.5 rounded-full" 
                      style={{ width: `${country.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
