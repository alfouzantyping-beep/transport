import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";

const excelColumns = [
  ["QATAR VISA", "qatarVisa"],
  ["QATAR INS", "qatarToll"],
  ["KSA VISA", "ksaVisa"],
  ["UAE CUSTOM", "uaeCustoms"],
  ["KSA CUSTOM", "ksaCustoms"],
  ["MEZAN", "mezan"],
  ["JORAN OUT", "jordanBorder"],
  ["CAMRA X", "cameraFine"],
  ["HAYA/PESHA", "hayaPeshgi"],
  ["TOLL GATE", "toll"],
  ["GATE PASS", "gatePass"],
  ["DIESEL", "diesel"],
  ["FOOD", "food"],
  ["BRODER", "border"],
  ["MAINTEANCE", "maintenance"],
] as const;

function money(v: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(v);
}

function filledColumns(expense: Record<string, unknown>) {
  return excelColumns
    .map(([label, field]) => ({ label, amount: Number(expense[field] || 0) }))
    .filter((item) => item.amount > 0);
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function makeHref(searchParams: Record<string, string | string[] | undefined>, updates: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(searchParams)) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `/trip-expenses?${query}` : "/trip-expenses";
}

function groupRows(
  expenses: Awaited<ReturnType<typeof getExpenses>>,
  groupBy: string
) {
  const groups = new Map<string, { label: string; count: number; amount: number; pettyCash: number; remaining: number }>();

  for (const expense of expenses) {
    const label =
      groupBy === "driver"
        ? expense.driver?.name || "No Driver"
        : groupBy === "truck"
          ? expense.trip.truck.truckNumber
          : `${expense.trip.tripNo || expense.trip.tripNumber} - ${expense.trip.customer.companyName || expense.trip.customer.name}`;

    const current = groups.get(label) || { label, count: 0, amount: 0, pettyCash: 0, remaining: 0 };
    current.count += 1;
    current.amount += Number(expense.amount || 0);
    current.pettyCash += Number(expense.pettyCash || 0);
    current.remaining += Number(expense.remainingBalance || 0);
    groups.set(label, current);
  }

  return Array.from(groups.values()).sort((a, b) => b.amount - a.amount);
}

async function getExpenses(where: Prisma.TripExpenseWhereInput, skip: number, take: number) {
  return prisma.tripExpense.findMany({
    where,
    include: {
      trip: { include: { customer: true, truck: true } },
      driver: true,
      vehicle: true,
      expenseCategory: true,
    },
    orderBy: { expenseDate: "desc" },
    skip,
    take,
  });
}

export default async function TripExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const driverId = getParam(sp, "driverId") || "";
  const truckId = getParam(sp, "truckId") || "";
  const tripId = getParam(sp, "tripId") || "";
  const customerId = getParam(sp, "customerId") || "";
  const categoryId = getParam(sp, "categoryId") || "";
  const dateFrom = getParam(sp, "dateFrom") || "";
  const dateTo = getParam(sp, "dateTo") || "";
  const groupBy = getParam(sp, "groupBy") || "";
  const page = Math.max(Number(getParam(sp, "page") || 1), 1);
  const pageSize = 25;

  const where: Prisma.TripExpenseWhereInput = {
    ...(driverId ? { driverId } : {}),
    ...(tripId ? { tripId } : {}),
    ...(categoryId ? { expenseCategoryId: categoryId } : {}),
    ...(dateFrom || dateTo
      ? {
          expenseDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999`) } : {}),
          },
        }
      : {}),
    ...(truckId || customerId
      ? {
          trip: {
            ...(truckId ? { truckId } : {}),
            ...(customerId ? { customerId } : {}),
          },
        }
      : {}),
  };

  const [expenses, groupedExpenses, totalRows, drivers, trucks, trips, customers, categories, aggregate] = await Promise.all([
    getExpenses(where, (page - 1) * pageSize, pageSize),
    groupBy ? getExpenses(where, 0, 10000) : Promise.resolve([]),
    prisma.tripExpense.count({ where }),
    prisma.driver.findMany({ orderBy: { name: "asc" } }),
    prisma.truck.findMany({ orderBy: { truckNumber: "asc" } }),
    prisma.trip.findMany({ orderBy: { tripDate: "desc" }, take: 200, include: { customer: true } }),
    prisma.customer.findMany({ orderBy: { companyName: "asc" } }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.tripExpense.aggregate({
      where,
      _sum: { amount: true, pettyCash: true, remainingBalance: true },
    }),
  ]);

  const total = Number(aggregate._sum.amount || 0);
  const pettyCash = Number(aggregate._sum.pettyCash || 0);
  const remaining = Number(aggregate._sum.remainingBalance || 0);
  const pageCount = Math.max(Math.ceil(totalRows / pageSize), 1);
  const grouped = groupBy ? groupRows(groupedExpenses, groupBy) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Trip Expenses</h1>
          <p className="text-sm text-slate-500">Excel-style petty cash rows for driver receipts.</p>
        </div>
        <Link href="/trip-expenses/create" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
          <Plus className="h-4 w-4" /> Add Expense
        </Link>
      </div>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4" action="/trip-expenses">
        <select name="driverId" defaultValue={driverId} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
          <option value="">All drivers</option>
          {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
        </select>
        <select name="truckId" defaultValue={truckId} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
          <option value="">All trucks</option>
          {trucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.truckNumber}</option>)}
        </select>
        <select name="tripId" defaultValue={tripId} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
          <option value="">All trips</option>
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id}>{trip.tripNo || trip.tripNumber} - {trip.customer.companyName || trip.customer.name}</option>
          ))}
        </select>
        <select name="customerId" defaultValue={customerId} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
          <option value="">All customers</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName || customer.name}</option>)}
        </select>
        <input name="dateFrom" defaultValue={dateFrom} type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold" />
        <input name="dateTo" defaultValue={dateTo} type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold" />
        <select name="categoryId" defaultValue={categoryId} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select name="groupBy" defaultValue={groupBy} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">
          <option value="">Expense rows</option>
          <option value="trip">Group by Trip</option>
          <option value="driver">Group by Driver</option>
          <option value="truck">Group by Truck</option>
        </select>
        <div className="flex gap-2 md:col-span-4">
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white" type="submit">Apply Filters</button>
          <Link className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700" href="/trip-expenses">Clear</Link>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">USED PETTY CASH</p>
          <p className="mt-2 text-2xl font-black">{money(total)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">PETTY CASH</p>
          <p className="mt-2 text-2xl font-black">{money(pettyCash)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">REMNING BAL</p>
          <p className="mt-2 text-2xl font-black">{money(remaining)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Rows</p>
          <p className="mt-2 text-2xl font-black">{totalRows}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {groupBy ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Group</th>
                <th className="p-3 text-right">Rows</th>
                <th className="p-3 text-right">Used Petty Cash</th>
                <th className="p-3 text-right">Petty Cash</th>
                <th className="p-3 text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grouped.map((group) => (
                <tr key={group.label} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{group.label}</td>
                  <td className="p-3 text-right font-semibold">{group.count}</td>
                  <td className="p-3 text-right font-black">{money(group.amount)}</td>
                  <td className="p-3 text-right font-black">{money(group.pettyCash)}</td>
                  <td className="p-3 text-right font-black">{money(group.remaining)}</td>
                </tr>
              ))}
              {!grouped.length && (
                <tr><td className="p-6 text-center text-slate-500" colSpan={5}>No expenses found.</td></tr>
              )}
            </tbody>
          </table>
        ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">DATE / TRIP</th>
              <th className="p-3">DRIVER / TRUCK</th>
              <th className="p-3">Customer / Category</th>
              <th className="p-3">Filled Excel Columns</th>
              <th className="p-3 text-right">USED PETTY CASH</th>
              <th className="p-3 text-right">REMNING BAL</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => {
              const columns = filledColumns(expense);
              return (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">
                    {expense.expenseDate.toLocaleDateString()}
                    <div className="text-xs text-slate-500">{expense.trip.tripNo || expense.trip.tripNumber}</div>
                  </td>
                  <td className="p-3">
                    {expense.driver?.name || "-"}
                    <div className="text-xs text-slate-500">{expense.trip.truck.truckNumber || expense.vehicle?.truckNo || "-"}</div>
                  </td>
                  <td className="p-3">
                    {expense.trip.customer.companyName || expense.trip.customer.name}
                    <div className="text-xs text-slate-500">{expense.expenseCategory?.name || "-"}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {columns.length ? columns.slice(0, 6).map((item) => (
                        <span key={item.label} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">
                          {item.label}: {money(item.amount)}
                        </span>
                      )) : <span className="text-slate-400">-</span>}
                      {columns.length > 6 && <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">+{columns.length - 6}</span>}
                    </div>
                  </td>
                  <td className="p-3 text-right font-black">{money(Number(expense.amount || 0))}</td>
                  <td className="p-3 text-right font-black">{money(Number(expense.remainingBalance || 0))}</td>
                  <td className="p-3"><Link className="text-xs font-bold text-emerald-700" href={`/trip-expenses/${expense.id}/edit`}>Edit</Link></td>
                </tr>
              );
            })}
            {!expenses.length && (
              <tr><td className="p-6 text-center text-slate-500" colSpan={7}>No expenses found.</td></tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-slate-500">Page {page} of {pageCount}</p>
        <div className="flex gap-2">
          <Link
            className={`rounded-lg border border-slate-200 px-3 py-2 font-bold ${page <= 1 ? "pointer-events-none text-slate-300" : "text-slate-700"}`}
            href={makeHref(sp, { page: page - 1 })}
          >
            Previous
          </Link>
          <Link
            className={`rounded-lg border border-slate-200 px-3 py-2 font-bold ${page >= pageCount ? "pointer-events-none text-slate-300" : "text-slate-700"}`}
            href={makeHref(sp, { page: page + 1 })}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
