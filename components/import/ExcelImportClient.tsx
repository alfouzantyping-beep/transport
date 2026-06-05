"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { runExcelImport } from "@/lib/import-actions";
import type { ImportConfig } from "@/lib/import-config";

type Row = Record<string, unknown>;

function guessColumn(headers: string[], label: string) {
  const wanted = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  return headers.find((header) => header.toLowerCase().replace(/[^a-z0-9]/g, "") === wanted) || "";
}

export default function ExcelImportClient({ config }: { config: ImportConfig }) {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const previewRows = rows.slice(0, 20);
  const missingRequired = useMemo(
    () => config.fields.filter((field) => field.required && !mapping[field.key]),
    [config.fields, mapping]
  );

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setFileName(file.name);

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError("Only .xlsx and .xls files are allowed.");
      return;
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
    const nextHeaders = parsed.length ? Object.keys(parsed[0]) : [];
    const nextMapping = Object.fromEntries(
      config.fields.map((field) => [field.key, guessColumn(nextHeaders, field.label)])
    );

    setHeaders(nextHeaders);
    setRows(parsed);
    setMapping(nextMapping);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-black text-slate-900">Upload Excel</h2>
            <p className="mt-1 text-xs text-slate-500">Upload old Excel records, then map columns before saving.</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-black uppercase text-slate-500">Expected Columns</p>
            <p className="mt-2 font-mono leading-5 text-emerald-700">{config.expectedColumns.join(", ")}</p>
          </div>

          <label className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-emerald-500">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => handleFileUpload(event.target.files?.[0])}
            />
            <Upload className="h-8 w-8 text-slate-400" />
            <span className="mt-3 text-sm font-black text-slate-800">{fileName || "Choose .xlsx / .xls file"}</span>
            <span className="mt-1 text-xs font-semibold text-slate-400">Preview first 20 rows before import</span>
          </label>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900">Map Columns</h2>
              <p className="mt-1 text-xs text-slate-500">Manually map Excel columns to system fields if names do not match.</p>
            </div>
            {rows.length > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {rows.length} rows loaded
              </span>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {config.fields.map((field) => (
              <label key={field.key} className="space-y-1">
                <span className="text-xs font-bold text-slate-600">
                  {field.label} {field.required && <span className="text-rose-600">*</span>}
                </span>
                <select
                  value={mapping[field.key] || ""}
                  onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">Not mapped</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {rows.length > 0 && missingRequired.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Required mappings missing: {missingRequired.map((field) => field.label).join(", ")}
            </div>
          )}

          {rows.length > 0 && missingRequired.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Mapping ready. Server will validate every row and import only valid records.
            </div>
          )}

          <form action={runExcelImport}>
            <input type="hidden" name="importKey" value={Object.keys(importKeyByPath).find((key) => importKeyByPath[key] === config.path) || ""} />
            <input type="hidden" name="fileName" value={fileName} />
            <input type="hidden" name="rows" value={JSON.stringify(rows)} />
            <input type="hidden" name="mapping" value={JSON.stringify(mapping)} />
            <button
              disabled={!rows.length || missingRequired.length > 0}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Validate & Save Valid Rows
            </button>
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-black text-slate-900">Preview First 20 Rows</h2>
          <p className="text-xs text-slate-500">Final validation happens on the server after submission.</p>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Row</th>
                {headers.map((header) => <th key={header} className="p-3">{header}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewRows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-500">{index + 2}</td>
                  {headers.map((header) => <td key={header} className="p-3">{String(row[header] ?? "")}</td>)}
                </tr>
              ))}
              {!previewRows.length && (
                <tr><td className="p-6 text-center text-slate-500" colSpan={Math.max(headers.length + 1, 2)}>Upload a file to preview rows.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const importKeyByPath: Record<string, string> = {
  trips: "/import/trips",
  "driver-cash": "/import/driver-cash",
  "trip-expenses": "/import/trip-expenses",
  salaries: "/import/salaries",
  maintenance: "/import/maintenance",
  "customer-balances": "/import/customer-balances",
};
