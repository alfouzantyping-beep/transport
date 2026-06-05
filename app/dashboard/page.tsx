import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  ClipboardList,
  Fuel,
  Gauge,
  ReceiptText,
  Route,
  Tags,
  Truck,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { prisma } from "@/lib/db";

function currency(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number) {
  return `${Math.round(value)}%`;
}

function sumExpense(row: Record<string, unknown>) {
  const keys = [
    "diesel",
    "petrol",
    "toll",
    "border",
    "visa",
    "customs",
    "food",
    "parking",
    "maintenance",
    "hotel",
    "other",
    "qatarVisa",
    "qatarToll",
    "ksaVisa",
    "uaeCustoms",
    "ksaCustoms",
    "mezan",
    "jordanBorder",
    "cameraFine",
    "hayaPeshgi",
    "gatePass",
  ];

  return keys.reduce((total, key) => total + Number(row[key] || 0), 0);
}

export default async function DashboardPage() {
  const [
    totalCustomers,
    totalDrivers,
    activeDrivers,
    totalVehicles,
    activeVehicles,
    expenseCategories,
    trips,
    tripExpenses,
    invoices,
    maintenanceLogs,
    salaries,
    recentTrips,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.driver.count(),
    prisma.driver.count({ where: { status: "ACTIVE" } }),
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
    prisma.expenseCategory.count(),
    prisma.trip.findMany({ select: { tripAmount: true, status: true } }),
    prisma.tripExpense.findMany(),
    prisma.invoice.findMany({ select: { totalAmount: true, pendingAmount: true, status: true } }),
    prisma.truckMaintenance.findMany({ select: { amount: true } }),
    prisma.driverMonthlySalary.findMany({ select: { netSalary: true } }),
    prisma.trip.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { companyName: true, name: true } },
        driver: { select: { name: true } },
        truck: { select: { truckNumber: true, plateNumber: true } },
      },
    }),
  ]);

  const tripRevenue = trips.reduce((total: number, trip: { tripAmount: number; status: string }) => total + Number(trip.tripAmount || 0), 0);
  const invoicedRevenue = invoices.reduce((total: number, invoice: { totalAmount: number; pendingAmount: number; status: string }) => total + Number(invoice.totalAmount || 0), 0);
  const totalRevenue = Math.max(tripRevenue, invoicedRevenue);
  const tripCost = tripExpenses.reduce((total: number, row: any) => total + sumExpense(row), 0);
  const maintenanceCost = maintenanceLogs.reduce((total: number, row: { amount: number }) => total + Number(row.amount || 0), 0);
  const salaryCost = salaries.reduce((total: number, row: { netSalary: number }) => total + Number(row.netSalary || 0), 0);
  const totalCost = tripCost + maintenanceCost + salaryCost;
  const netProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const activeTrips = trips.filter((trip: { status: string }) => trip.status === "LOADING" || trip.status === "IN_TRANSIT").length;
  const deliveredTrips = trips.filter((trip: { status: string }) => trip.status === "DELIVERED").length;
  const outstanding = invoices.reduce((total: number, invoice: { pendingAmount: number }) => total + Number(invoice.pendingAmount || 0), 0);
  const fleetUtilization = totalVehicles > 0 ? ((totalVehicles - activeVehicles) / totalVehicles) * 100 : 0;
  const driverAvailability = totalDrivers > 0 ? (activeDrivers / totalDrivers) * 100 : 0;

  const financeCards = [
    {
      label: "Total Revenue",
      value: currency(totalRevenue),
      note: `${trips.length} trips recorded`,
      icon: CircleDollarSign,
      accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    {
      label: "Total Cost",
      value: currency(totalCost),
      note: `${currency(tripCost)} trip expenses`,
      icon: WalletCards,
      accent: "bg-rose-50 text-rose-700 ring-rose-100",
    },
    {
      label: "Net Profit",
      value: currency(netProfit),
      note: `${percent(margin)} profit margin`,
      icon: Banknote,
      accent: "bg-sky-50 text-sky-700 ring-sky-100",
    },
    {
      label: "Outstanding",
      value: currency(outstanding),
      note: `${invoices.filter((invoice: any) => invoice.status !== "PAID").length} unpaid invoices`,
      icon: ReceiptText,
      accent: "bg-amber-50 text-amber-700 ring-amber-100",
    },
  ];

  const operationCards = [
    { label: "Active Trips", value: activeTrips, note: `${deliveredTrips} delivered`, icon: Route, href: "/dashboard/trips" },
    { label: "Customers", value: totalCustomers, note: "Master accounts", icon: Users, href: "/customers" },
    { label: "Drivers", value: totalDrivers, note: `${activeDrivers} active`, icon: UserCheck, href: "/drivers" },
    { label: "Vehicles", value: totalVehicles, note: `${activeVehicles} available`, icon: Truck, href: "/vehicles" },
    { label: "Categories", value: expenseCategories, note: "Expense controls", icon: Tags, href: "/expense-categories" },
  ];

  const costBreakdown = [
    { label: "Trip Expenses", value: tripCost, color: "bg-emerald-600" },
    { label: "Maintenance", value: maintenanceCost, color: "bg-sky-600" },
    { label: "Driver Salaries", value: salaryCost, color: "bg-amber-500" },
  ];
  const maxCost = Math.max(...costBreakdown.map((item) => item.value), 1);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <section className="overflow-hidden rounded-2xl border border-emerald-100/60 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white p-6 shadow-[0_12px_36px_-12px_rgba(16,185,129,0.1)]">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Operations Command Center</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Transport ERP Dashboard</h1>
              <p className="mt-2 max-w-2xl text-xs font-semibold leading-relaxed text-slate-500">
                Monitor fleet utilization, driver availability, real-time trip revenues, petty cash margins, and outstanding invoicing lists for GCC transport logistics.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 font-bold">
              <Link href="/dashboard/trips" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 px-4 py-2.5 text-xs text-white shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all duration-300">
                Manage Trips <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/vehicles" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm">
                Fleet Master <Truck className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-100/30 bg-white/70 backdrop-blur-sm p-4.5 shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fleet Utilization</p>
              <p className="mt-2.5 text-3xl font-black text-slate-800">{percent(fleetUtilization)}</p>
              <div className="mt-3.5 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]" style={{ width: `${Math.min(fleetUtilization, 100)}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100/30 bg-white/70 backdrop-blur-sm p-4.5 shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Driver Availability</p>
              <p className="mt-2.5 text-3xl font-black text-slate-800">{percent(driverAvailability)}</p>
              <div className="mt-3.5 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 shadow-[0_0_8px_rgba(45,212,191,0.2)]" style={{ width: `${Math.min(driverAvailability, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Finance Grid */}
      <section className="grid gap-4 xl:grid-cols-4">
        {financeCards.map((card) => (
          <div key={card.label} className="premium-card p-5 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(0,0,0,0.025)] transition-all duration-300 cursor-pointer">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className="text-2xl font-black tracking-tight text-slate-800">{card.value}</p>
                <p className="text-[11px] font-bold text-slate-400">{card.note}</p>
              </div>
              <div className={`rounded-xl p-3 bg-gradient-to-br border shadow-sm ${
                card.label.includes("Cost") 
                  ? "from-rose-50 to-white text-rose-600 border-rose-100/60 shadow-rose-100/10"
                  : card.label.includes("Revenue")
                  ? "from-emerald-50 to-white text-emerald-600 border-emerald-100/60 shadow-emerald-100/10"
                  : card.label.includes("Profit")
                  ? "from-sky-50 to-white text-sky-600 border-sky-100/60 shadow-sky-100/10"
                  : "from-amber-50 to-white text-amber-600 border-amber-100/60 shadow-amber-100/10"
              }`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Split Snapshot Section */}
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Operations Snapshot Card */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Operations Snapshot</h2>
              <p className="text-xs font-semibold text-slate-400">Live operational counts from master models.</p>
            </div>
            <div className="rounded-xl border border-slate-200/60 bg-white p-2 text-slate-400 shadow-sm">
              <Gauge className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {operationCards.map((card) => (
              <Link key={card.label} href={card.href} className="rounded-xl border border-slate-200/50 bg-slate-50/40 p-4 transition-all duration-300 hover:border-emerald-250 hover:bg-emerald-50/20 hover:-translate-y-0.5 hover:shadow-sm">
                <card.icon className="h-4.5 w-4.5 text-slate-400" />
                <p className="mt-3 text-2xl font-black text-slate-800">{card.value}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-400">{card.note}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Cost Breakdown Card */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between border-b border-slate-100/80 pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Cost Breakdown</h2>
              <p className="text-xs font-semibold text-slate-400">Distribution of expenditures.</p>
            </div>
            <div className="rounded-xl border border-slate-200/60 bg-white p-2 text-slate-400 shadow-sm">
              <Fuel className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {costBreakdown.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-800 font-extrabold">{currency(item.value)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 shadow-inner">
                  <div className={`h-2.5 rounded-full bg-gradient-to-r ${
                    item.color.includes("emerald") 
                      ? "from-emerald-400 to-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.15)]"
                      : item.color.includes("sky")
                      ? "from-sky-400 to-sky-500 shadow-[0_0_6px_rgba(56,189,248,0.15)]"
                      : "from-amber-400 to-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.15)]"
                  }`} style={{ width: `${Math.max((item.value / maxCost) * 100, item.value > 0 ? 8 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tables and Quick Actions Grid */}
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Recent Trips Table */}
        <div className="premium-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/20">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Recent Trips</h2>
              <p className="text-xs font-semibold text-slate-400">Latest active transit movements.</p>
            </div>
            <Link href="/dashboard/trips" className="text-xs font-extrabold uppercase tracking-wide text-emerald-600 hover:text-emerald-700 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-3">Trip</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3 text-right">Freight</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {recentTrips.map((trip: any) => (
                  <tr key={trip.id}>
                    <td className="p-3 text-xs font-black text-slate-800">{trip.tripNumber}</td>
                    <td className="p-3 text-xs font-bold text-slate-600 truncate max-w-[150px]">{trip.customer.companyName || trip.customer.name}</td>
                    <td className="p-3 text-xs text-slate-500 font-semibold">{trip.driver.name}</td>
                    <td className="p-3 text-xs text-slate-500 font-semibold">{trip.truck.truckNumber}</td>
                    <td className="p-3 text-right text-xs font-black text-slate-800">{currency(Number(trip.tripAmount))}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide border ${
                        trip.status === "DELIVERED" || trip.status === "COMPLETED" || trip.status === "CLOSED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : trip.status === "IN_TRANSIT" || trip.status === "ON_TRIP"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : trip.status === "CANCELLED"
                          ? "bg-rose-50 text-rose-700 border-rose-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>{trip.status.replace("_", " ")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">Quick Actions</h2>
              <p className="text-xs font-semibold text-slate-400">Common ERP entries.</p>
            </div>
            <div className="rounded-xl border border-slate-200/60 bg-white p-2 text-slate-400 shadow-sm">
              <ClipboardList className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-5 grid gap-2.5">
            {[
              ["Add Customer", "/customers/create"],
              ["Add Driver", "/drivers/create"],
              ["Add Vehicle", "/vehicles/create"],
              ["Company Settings", "/settings/company"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-black text-slate-600 hover:border-emerald-250 hover:bg-emerald-50/30 hover:text-emerald-800 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(16,185,129,0.03)] transition-all duration-300">
                {label}
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
