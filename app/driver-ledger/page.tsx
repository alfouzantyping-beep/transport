import Link from "next/link";
import { getDriverLedgerSummaries, formatMoney } from "@/lib/driver-ledger";

function balanceLabel(balance: number) {
  if (balance > 0) return "Driver owes company";
  if (balance < 0) return "Company owes driver";
  return "Settled";
}

export default async function DriverLedgerPage() {
  const summaries = await getDriverLedgerSummaries();
  const totals = summaries.reduce(
    (acc, item) => ({
      trips: acc.trips + item.totalTrips,
      cash: acc.cash + item.totalCashGiven,
      expenses: acc.expenses + item.totalExpenses,
      driverOwes: acc.driverOwes + item.totalDriverOwesCompany,
      companyOwes: acc.companyOwes + item.totalCompanyOwesDriver,
    }),
    { trips: 0, cash: 0, expenses: 0, driverOwes: 0, companyOwes: 0 }
  );
  const finalBalance = totals.driverOwes - totals.companyOwes;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Driver Ledger</h1>
        <p className="text-sm text-slate-500">Running trip balances calculated from cash, expenses, and settlements.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Trips</p>
          <p className="mt-2 text-2xl font-black">{totals.trips}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Cash Given</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(totals.cash)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Expenses</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(totals.expenses)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Driver Owes</p>
          <p className="mt-2 text-2xl font-black text-rose-700">{formatMoney(totals.driverOwes)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Final Balance</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(finalBalance)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Driver</th>
              <th className="p-3 text-right">Total Trips</th>
              <th className="p-3 text-right">Cash Given</th>
              <th className="p-3 text-right">Expenses</th>
              <th className="p-3 text-right">Driver Owes Company</th>
              <th className="p-3 text-right">Company Owes Driver</th>
              <th className="p-3 text-right">Final Balance</th>
              <th className="p-3">Result</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summaries.map((summary) => (
              <tr key={summary.driverId} className="hover:bg-slate-50">
                <td className="p-3 font-bold">
                  <Link className="text-emerald-700" href={`/driver-ledger/${summary.driverId}`}>
                    {summary.driverName}
                  </Link>
                </td>
                <td className="p-3 text-right font-semibold">{summary.totalTrips}</td>
                <td className="p-3 text-right font-semibold">{formatMoney(summary.totalCashGiven)}</td>
                <td className="p-3 text-right font-semibold">{formatMoney(summary.totalExpenses)}</td>
                <td className="p-3 text-right font-black text-rose-700">{formatMoney(summary.totalDriverOwesCompany)}</td>
                <td className="p-3 text-right font-black text-emerald-700">{formatMoney(summary.totalCompanyOwesDriver)}</td>
                <td className="p-3 text-right font-black">{formatMoney(summary.finalBalance)}</td>
                <td className="p-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                    {balanceLabel(summary.finalBalance)}
                  </span>
                </td>
                <td className="p-3">
                  <Link
                    className="inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                    href={`/driver-ledger/${summary.driverId}`}
                  >
                    Open History
                  </Link>
                </td>
              </tr>
            ))}
            {!summaries.length && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={9}>No drivers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
