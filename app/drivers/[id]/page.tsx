import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  formatDate,
  formatMoney,
  getDriverLedgerTrips,
  summarizeLedgerTrips,
} from "@/lib/driver-ledger";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const tabs = [
  ["profile", "Profile"],
  ["trips", "Trip History"],
  ["cash", "Cash Advances"],
  ["expenses", "Trip Expenses"],
  ["settlements", "Settlements"],
  ["salary", "Salary"],
  ["balance", "Final Balance"],
] as const;

function getTab(searchParams: Record<string, string | string[] | undefined>) {
  const value = searchParams.tab;
  const tab = Array.isArray(value) ? value[0] : value;
  return tabs.some(([key]) => key === tab) ? tab || "profile" : "profile";
}

function TabLink({ driverId, activeTab, tab, label }: { driverId: string; activeTab: string; tab: string; label: string }) {
  const active = activeTab === tab;
  return (
    <Link
      href={`/drivers/${driverId}?tab=${tab}`}
      className={`rounded-lg px-3 py-2 text-xs font-bold ${active ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
    >
      {label}
    </Link>
  );
}

export default async function DriverDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const activeTab = getTab(sp);

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      trips: { include: { customer: true, truck: true }, orderBy: { tripDate: "desc" } },
      cashAdvances: { include: { trip: true }, orderBy: { cashDate: "desc" } },
      expenses: { include: { trip: { include: { customer: true, truck: true } }, expenseCategory: true }, orderBy: { expenseDate: "desc" } },
      settlements: { include: { trip: true }, orderBy: { createdAt: "desc" } },
      salaries: { orderBy: { salaryMonth: "desc" } },
    },
  });
  if (!driver) notFound();

  const ledgerTrips = await getDriverLedgerTrips(id);
  const ledgerSummary = summarizeLedgerTrips(driver.id, driver.name, ledgerTrips);
  const fields = [
    "mobile",
    "passportNo",
    "emiratesId",
    "licenseNo",
    "licenseExpiry",
    "visaExpiry",
    "basicSalary",
    "advanceBalance",
    "visaBalance",
    "status",
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">{driver.name}</h1>
          <p className="text-sm text-slate-500">Driver profile, trip activity, salary, and ledger balance.</p>
        </div>
        <Link className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white" href={`/drivers/${id}/edit`}>
          Edit
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(([tab, label]) => (
          <TabLink key={tab} driverId={id} activeTab={activeTab} tab={tab} label={label} />
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
          {fields.map((key) => {
            const value = driver[key as keyof typeof driver];
            return (
              <div key={key}>
                <p className="text-xs font-bold uppercase text-slate-500">{key}</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {value instanceof Date ? formatDate(value) : String(value ?? "")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "trips" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr><th className="p-3">Trip</th><th className="p-3">Date</th><th className="p-3">Truck</th><th className="p-3">Customer</th><th className="p-3">Route</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driver.trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{trip.tripNo || trip.tripNumber}</td>
                  <td className="p-3">{formatDate(trip.tripDate)}</td>
                  <td className="p-3">{trip.truck.truckNumber}</td>
                  <td className="p-3">{trip.customer.companyName || trip.customer.name}</td>
                  <td className="p-3">{trip.loadingPoint || trip.fromCountry} to {trip.deliveryPoint || trip.toCountry}</td>
                  <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{trip.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "cash" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr><th className="p-3">Trip</th><th className="p-3">Date</th><th className="p-3">Method</th><th className="p-3">Given By</th><th className="p-3 text-right">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driver.cashAdvances.map((cash) => (
                <tr key={cash.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{cash.trip.tripNo || cash.trip.tripNumber}</td>
                  <td className="p-3">{formatDate(cash.cashDate)}</td>
                  <td className="p-3">{cash.paymentMethod.replace("_", " ")}</td>
                  <td className="p-3">{cash.givenBy}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(cash.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr><th className="p-3">Trip</th><th className="p-3">Date</th><th className="p-3">Truck</th><th className="p-3">Category</th><th className="p-3 text-right">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driver.expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{expense.trip.tripNo || expense.trip.tripNumber}</td>
                  <td className="p-3">{formatDate(expense.expenseDate)}</td>
                  <td className="p-3">{expense.trip.truck.truckNumber}</td>
                  <td className="p-3">{expense.expenseCategory?.name || "-"}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(expense.amount || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "settlements" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr><th className="p-3">Trip</th><th className="p-3 text-right">Cash</th><th className="p-3 text-right">Expenses</th><th className="p-3 text-right">Balance</th><th className="p-3">Result</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driver.settlements.map((settlement) => (
                <tr key={settlement.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{settlement.trip.tripNo || settlement.trip.tripNumber}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(settlement.totalCashGiven))}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(settlement.totalExpenses))}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(settlement.settlementBalance))}</td>
                  <td className="p-3">{settlement.resultType.replaceAll("_", " ")}</td>
                  <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{settlement.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "salary" && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr><th className="p-3">Month</th><th className="p-3 text-right">Basic</th><th className="p-3 text-right">Deduction</th><th className="p-3 text-right">Net Salary</th><th className="p-3 text-right">Paid</th><th className="p-3 text-right">Balance</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driver.salaries.map((salary) => (
                <tr key={salary.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{salary.salaryMonth}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(salary.basicSalary))}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(salary.totalDeduction))}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(salary.netSalary))}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(salary.paidAmount))}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(salary.balance))}</td>
                  <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{salary.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "balance" && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Trips</p><p className="mt-2 text-2xl font-black">{ledgerSummary.totalTrips}</p></div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Cash Given</p><p className="mt-2 text-2xl font-black">{formatMoney(ledgerSummary.totalCashGiven)}</p></div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Expenses</p><p className="mt-2 text-2xl font-black">{formatMoney(ledgerSummary.totalExpenses)}</p></div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Driver Owes</p><p className="mt-2 text-2xl font-black text-rose-700">{formatMoney(ledgerSummary.totalDriverOwesCompany)}</p></div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Company Owes</p><p className="mt-2 text-2xl font-black text-emerald-700">{formatMoney(ledgerSummary.totalCompanyOwesDriver)}</p></div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Final Balance</p>
            <p className="mt-2 text-3xl font-black">{formatMoney(ledgerSummary.finalBalance)}</p>
            <p className="mt-1 text-sm font-bold text-slate-600">
              {ledgerSummary.finalBalance > 0 ? "Driver owes company" : ledgerSummary.finalBalance < 0 ? "Company owes driver" : "Settled"}
            </p>
            <Link className="mt-4 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white" href={`/driver-ledger/${id}`}>
              Open Full Ledger
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
