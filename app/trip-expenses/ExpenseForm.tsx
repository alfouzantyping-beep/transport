"use client";

import { useMemo, useState } from "react";
import { createTripExpense, updateTripExpense } from "@/lib/operations";

type TripOption = {
  id: string;
  tripNo?: string | null;
  tripNumber: string;
  tripDate?: Date | string | null;
  doNumber?: string | null;
  loadingPoint?: string | null;
  deliveryPoint?: string | null;
  customer?: { companyName: string } | null;
  driver: { name: string };
  vehicle?: { truckNo: string } | null;
  cashTotal?: number;
};

type ExpenseRecord = Record<string, number | string | Date | null | undefined> & {
  id?: string;
  tripId?: string;
  expenseDate?: Date | string | null;
  receiptNo?: string | null;
  receiptImageUrl?: string | null;
  description?: string | null;
  notes?: string | null;
  pettyCash?: number;
};

const excelColumns = [
  { label: "QATAR VISA", field: "qatarVisa" },
  { label: "QATAR INS", field: "qatarToll" },
  { label: "KSA VISA", field: "ksaVisa" },
  { label: "UAE CUSTOM", field: "uaeCustoms" },
  { label: "KSA CUSTOM", field: "ksaCustoms" },
  { label: "MEZAN", field: "mezan" },
  { label: "JORAN OUT", field: "jordanBorder" },
  { label: "CAMRA X", field: "cameraFine" },
  { label: "HAYA/PESHA", field: "hayaPeshgi" },
  { label: "TOLL GATE", field: "toll" },
  { label: "GATE PASS", field: "gatePass" },
  { label: "DIESEL", field: "diesel" },
  { label: "FOOD", field: "food" },
  { label: "BRODER", field: "border" },
  { label: "MAINTEANCE", field: "maintenance" },
] as const;

function dateValue(value?: Date | string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function money(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

function readAmount(expense: ExpenseRecord | undefined, field: string) {
  const value = expense?.[field];
  return typeof value === "number" && value > 0 ? String(value) : "";
}

export default function ExpenseForm({
  expense,
  trips,
}: {
  expense?: ExpenseRecord;
  trips: TripOption[];
}) {
  const isEdit = Boolean(expense?.id);
  const action = isEdit && expense?.id ? updateTripExpense.bind(null, expense.id) : createTripExpense;
  const [selectedTripId, setSelectedTripId] = useState(expense?.tripId || "");
  const [expenseDate, setExpenseDate] = useState(dateValue(expense?.expenseDate));
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(excelColumns.map((column) => [column.field, readAmount(expense, column.field)]))
  );
  const input = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);
  const usedPettyCash = useMemo(
    () => Object.values(amounts).reduce((sum, value) => sum + Number(value || 0), 0),
    [amounts]
  );
  const pettyCash = Number(selectedTrip?.cashTotal ?? expense?.pettyCash ?? 0);
  const remaining = pettyCash - usedPettyCash;
  const filledColumns = Object.values(amounts).filter((value) => Number(value || 0) > 0).length;

  const rowPreview = [
    { label: "DATE", value: expenseDate },
    { label: "DRIVER", value: selectedTrip?.driver.name || "-" },
    { label: "TRUCK", value: selectedTrip?.vehicle?.truckNo || "-" },
    { label: "DO/NO", value: selectedTrip?.doNumber || "-" },
    { label: "CLIENT", value: selectedTrip?.customer?.companyName || "-" },
    { label: "LOADING", value: selectedTrip?.loadingPoint || "-" },
    { label: "LOADING TO", value: selectedTrip?.deliveryPoint || "-" },
  ];

  return (
    <form action={action} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="pettyCash" value={pettyCash} />

      <div className="grid gap-4 xl:grid-cols-4">
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Trip
          <select className={input} name="tripId" value={selectedTripId} onChange={(event) => setSelectedTripId(event.target.value)} required>
            <option value="">Select trip</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.tripNo || trip.tripNumber} - {trip.driver.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-bold text-slate-700">
          DATE
          <input className={input} type="date" name="expenseDate" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} required />
        </label>

        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Receipt No
          <input className={input} name="receiptNo" defaultValue={expense?.receiptNo || ""} placeholder="DSL-1001" />
        </label>

        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Receipt Image URL
          <input className={input} name="receiptImageUrl" defaultValue={expense?.receiptImageUrl || ""} placeholder="Upload placeholder URL" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-500">DRIVER</p>
          <p className="mt-1 truncate text-lg font-black text-slate-950">{selectedTrip?.driver.name || "-"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-500">PETTY CASH</p>
          <p className="mt-1 text-lg font-black text-slate-950">{money(pettyCash)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-500">USED PETTY CASH</p>
          <p className="mt-1 text-lg font-black text-slate-950">{money(usedPettyCash)}</p>
        </div>
        <div className={`rounded-lg border p-4 ${remaining < 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
          <p className="text-xs font-black uppercase text-slate-500">REMNING BAL</p>
          <p className={`mt-1 text-lg font-black ${remaining < 0 ? "text-red-700" : "text-emerald-700"}`}>{money(remaining)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">Excel row preview</p>
            <p className="text-xs font-semibold text-slate-500">These fixed columns match the petty cash sheet structure.</p>
          </div>
          <p className="text-xs font-black text-slate-500">{filledColumns} filled / {excelColumns.length} expense columns</p>
        </div>
        <div className="grid gap-2 md:grid-cols-7">
          {rowPreview.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase text-slate-500">{item.label}</p>
              <p className="mt-1 truncate text-sm font-black text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4">
          <p className="text-sm font-black text-slate-950">Expense columns</p>
          <p className="text-xs font-semibold text-slate-500">Fill only invoice columns that have an amount. Empty columns save as 0.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {excelColumns.map((column) => {
            const isFilled = Number(amounts[column.field] || 0) > 0;
            return (
              <label
                key={column.field}
                className={`rounded-lg border bg-white p-3 transition ${
                  isFilled ? "border-emerald-300 shadow-sm ring-2 ring-emerald-50" : "border-slate-200"
                }`}
              >
                <span className="block text-xs font-black uppercase text-slate-950">{column.label}</span>
                <input
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  type="number"
                  step="0.01"
                  min="0"
                  name={column.field}
                  placeholder="0.00"
                  value={amounts[column.field] || ""}
                  onChange={(event) =>
                    setAmounts((current) => ({
                      ...current,
                      [column.field]: event.target.value,
                    }))
                  }
                />
              </label>
            );
          })}
        </div>
      </div>

      <label className="grid gap-1 text-sm font-bold text-slate-700">
        Description / Notes
        <textarea className={input} name="description" defaultValue={expense?.description || expense?.notes || ""} />
      </label>

      <button className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">
        Save Expense
      </button>
    </form>
  );
}
