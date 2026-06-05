import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  formatDate,
  formatMoney,
  getDriverLedgerTrips,
  summarizeLedgerTrips,
} from "@/lib/driver-ledger";
import { markSalaryPaid, settleAllDriverTrips, settleDriverTrip } from "@/lib/driver-ledger-actions";

function resultClass(resultType: string) {
  if (resultType === "DRIVER_OWES_COMPANY") return "bg-rose-50 text-rose-700";
  if (resultType === "COMPANY_OWES_DRIVER") return "bg-emerald-50 text-emerald-700";
  return "bg-slate-100 text-slate-700";
}

function balanceLabel(balance: number) {
  if (balance > 0) return "Driver owes company";
  if (balance < 0) return "Company owes driver";
  return "Settled";
}

function settlementButtonLabel(balance: number) {
  if (balance > 0) return "Mark Driver Paid";
  if (balance < 0) return "Mark Company Paid";
  return "Mark Settled";
}

export default async function DriverLedgerDetailPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = await params;
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      cashAdvances: { include: { trip: true }, orderBy: { cashDate: "desc" } },
      expenses: {
        include: {
          trip: { include: { customer: true, truck: true } },
          expenseCategory: true,
        },
        orderBy: { expenseDate: "desc" },
      },
      settlements: { include: { trip: true }, orderBy: { createdAt: "desc" } },
      salaries: { orderBy: { salaryMonth: "desc" } },
    },
  });
  if (!driver) notFound();

  const trips = await getDriverLedgerTrips(driverId);
  const summary = summarizeLedgerTrips(driver.id, driver.name, trips);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">{driver.name}</h1>
          <p className="text-sm text-slate-500">Driver ledger history and running balance.</p>
        </div>
        <Link className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white" href="/driver-ledger">
          Back to Ledger
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Trips</p>
          <p className="mt-2 text-2xl font-black">{summary.totalTrips}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Cash Given</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(summary.totalCashGiven)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Expenses</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(summary.totalExpenses)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Company Owes</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{formatMoney(summary.totalCompanyOwesDriver)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Final Balance</p>
          <p className="mt-2 text-2xl font-black">{formatMoney(summary.finalBalance)}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{balanceLabel(summary.finalBalance)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900">Admin Settlement Control</h2>
          <p className="text-xs text-slate-500">
            Clear all pending driver/company trip balances from this page after payment is completed.
          </p>
        </div>
        <form action={settleAllDriverTrips}>
          <input type="hidden" name="driverId" value={driver.id} />
          <input type="hidden" name="notes" value={`Bulk ledger settlement for ${driver.name}`} />
          <button
            disabled={summary.finalBalance === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {summary.finalBalance === 0
              ? "All Clear"
              : `${summary.finalBalance > 0 ? "Driver Paid" : "Company Paid"} ${formatMoney(Math.abs(summary.finalBalance))}`}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-black text-slate-900">Trip Settlement History</h2>
          <p className="text-xs text-slate-500">Cash minus trip expenses per trip.</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Trip No</th>
              <th className="p-3">Trip Date</th>
              <th className="p-3">Truck No</th>
              <th className="p-3">Customer</th>
              <th className="p-3">From</th>
              <th className="p-3">To</th>
              <th className="p-3 text-right">Cash Given</th>
              <th className="p-3 text-right">Total Expenses</th>
              <th className="p-3 text-right">Settlement Balance</th>
              <th className="p-3">Result Type</th>
              <th className="p-3">Settlement Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips.map((trip) => (
              <tr key={trip.tripId} className="hover:bg-slate-50">
                <td className="p-3 font-bold">{trip.tripNo}</td>
                <td className="p-3">{formatDate(trip.tripDate)}</td>
                <td className="p-3">{trip.truckNo}</td>
                <td className="p-3">{trip.customer}</td>
                <td className="p-3">{trip.from}</td>
                <td className="p-3">{trip.to}</td>
                <td className="p-3 text-right font-black">{formatMoney(trip.cashGiven)}</td>
                <td className="p-3 text-right font-black">{formatMoney(trip.totalExpenses)}</td>
                <td className="p-3 text-right font-black">{formatMoney(trip.settlementBalance)}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${resultClass(trip.resultType)}`}>
                    {trip.resultType.replaceAll("_", " ")}
                  </span>
                  <div className="mt-1 text-xs text-slate-500">{trip.message}</div>
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                    {trip.settlementStatus}
                  </span>
                </td>
                <td className="p-3">
                  {trip.settlementStatus === "SETTLED" ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Cleared</span>
                  ) : (
                    <form action={settleDriverTrip}>
                      <input type="hidden" name="tripId" value={trip.tripId} />
                      <input type="hidden" name="notes" value={`Ledger settlement: ${trip.message}`} />
                      <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                        {settlementButtonLabel(trip.settlementBalance)}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {!trips.length && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={12}>No trips found for this driver.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-black text-slate-900">Cash Advances / Payments Given</h2>
            <p className="text-xs text-slate-500">All cash issued to this driver by trip.</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Trip</th>
                <th className="p-3">Date</th>
                <th className="p-3">Method</th>
                <th className="p-3">Given By</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driver.cashAdvances.map((cash) => (
                <tr key={cash.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{cash.trip.tripNo || cash.trip.tripNumber}</td>
                  <td className="p-3">{formatDate(cash.cashDate)}</td>
                  <td className="p-3">{cash.paymentMethod.replace("_", " ")}</td>
                  <td className="p-3">{cash.givenBy}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(cash.amount || 0))}</td>
                </tr>
              ))}
              {!driver.cashAdvances.length && (
                <tr><td className="p-6 text-center text-slate-500" colSpan={5}>No cash advances found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-black text-slate-900">Trip Expense Details</h2>
            <p className="text-xs text-slate-500">Receipts and expense rows entered for this driver.</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Trip</th>
                <th className="p-3">Date</th>
                <th className="p-3">Truck</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driver.expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">
                    {expense.trip.tripNo || expense.trip.tripNumber}
                    <div className="text-xs font-normal text-slate-500">{expense.trip.customer.companyName || expense.trip.customer.name}</div>
                  </td>
                  <td className="p-3">{formatDate(expense.expenseDate)}</td>
                  <td className="p-3">{expense.trip.truck.truckNumber}</td>
                  <td className="p-3">{expense.expenseCategory?.name || expense.receiptNo || "-"}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(expense.amount || 0))}</td>
                </tr>
              ))}
              {!driver.expenses.length && (
                <tr><td className="p-6 text-center text-slate-500" colSpan={5}>No trip expenses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-black text-slate-900">Saved Settlements</h2>
            <p className="text-xs text-slate-500">Settlement records already closed or pending.</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Trip</th>
                <th className="p-3 text-right">Cash</th>
                <th className="p-3 text-right">Expenses</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driver.settlements.map((settlement) => (
                <tr key={settlement.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{settlement.trip.tripNo || settlement.trip.tripNumber}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(settlement.totalCashGiven || 0))}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(settlement.totalExpenses || 0))}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(settlement.settlementBalance || 0))}</td>
                  <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{settlement.status}</span></td>
                  <td className="p-3">
                    {settlement.status === "SETTLED" ? (
                      <span className="text-xs font-bold text-emerald-700">Cleared</span>
                    ) : (
                      <form action={settleDriverTrip}>
                        <input type="hidden" name="tripId" value={settlement.tripId} />
                        <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Mark Settled</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {!driver.settlements.length && (
                <tr><td className="p-6 text-center text-slate-500" colSpan={6}>No saved settlements found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-black text-slate-900">Salary / Payment Ledger</h2>
            <p className="text-xs text-slate-500">Monthly salary payments and pending balances.</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Month</th>
                <th className="p-3 text-right">Net</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driver.salaries.map((salary) => (
                <tr key={salary.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{salary.salaryMonth}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(salary.netSalary || 0))}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(salary.paidAmount || 0))}</td>
                  <td className="p-3 text-right font-black">{formatMoney(Number(salary.balance || 0))}</td>
                  <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{salary.status}</span></td>
                  <td className="p-3">
                    {salary.status === "PAID" ? (
                      <span className="text-xs font-bold text-emerald-700">Cleared</span>
                    ) : (
                      <form action={markSalaryPaid}>
                        <input type="hidden" name="salaryId" value={salary.id} />
                        <input type="hidden" name="driverId" value={driver.id} />
                        <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
                          Mark Paid
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {!driver.salaries.length && (
                <tr><td className="p-6 text-center text-slate-500" colSpan={6}>No salary records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
