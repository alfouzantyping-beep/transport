"use client";

import { useState } from "react";
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";

interface ValidationRow {
  rowNum: number;
  data: any;
  status: "VALID" | "INVALID";
  errors: string[];
}

export default function ImportPage() {
  const [importType, setImportType] = useState("trips");
  const [fileData, setFileData] = useState<ValidationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setSuccessMsg("");
    setFileData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Perform live client-side validations based on import type
        const validatedRows = jsonData.map((row: any, index) => {
          const errors: string[] = [];
          
          if (importType === "trips") {
            if (!row.Customer) errors.push("Missing Customer column");
            if (!row.Driver) errors.push("Missing Driver column");
            if (!row.Truck) errors.push("Missing Truck Number");
            if (!row.Amount || isNaN(Number(row.Amount))) errors.push("Invalid freight Amount");
            if (!row.FromCountry || !row.ToCountry) errors.push("Missing origin/destination country");
          } else if (importType === "driver_cash") {
            if (!row.TripNumber) errors.push("Missing TripNumber link");
            if (!row.Amount || isNaN(Number(row.Amount))) errors.push("Invalid cash Amount");
            if (!row.Date) errors.push("Missing cash date");
          } else if (importType === "salaries") {
            if (!row.Driver) errors.push("Missing Driver name");
            if (!row.BaseSalary || isNaN(Number(row.BaseSalary))) errors.push("Invalid BaseSalary");
            if (!row.Month || isNaN(Number(row.Month)) || Number(row.Month) < 1 || Number(row.Month) > 12) {
              errors.push("Invalid Month (must be 1-12)");
            }
          } else if (importType === "maintenance") {
            if (!row.Truck) errors.push("Missing Truck Number");
            if (!row.Amount || isNaN(Number(row.Amount))) errors.push("Invalid maintenance Amount");
            if (!row.Date) errors.push("Missing log date");
          }

          return {
            rowNum: index + 2, // Excel rows are 1-based, plus header row
            data: row,
            status: errors.length === 0 ? "VALID" : "INVALID",
            errors,
          } as ValidationRow;
        });

        setFileData(validatedRows);
      } catch (err) {
        console.error(err);
        alert("Failed to parse file. Make sure it is a valid Excel spreadsheet (.xlsx, .xls or .csv)");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveImport = () => {
    setLoading(true);
    // Simulate API database insertion
    setTimeout(() => {
      setSuccessMsg(`Import successful! Added ${fileData.filter(r => r.status === "VALID").length} valid records to the database.`);
      setFileData([]);
      setFileName("");
      setLoading(false);
    }, 1500);
  };

  const getInvalidCount = () => fileData.filter((r) => r.status === "INVALID").length;
  const getValidCount = () => fileData.filter((r) => r.status === "VALID").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900">Import Historical Records</h1>
        <p className="text-xs text-slate-455 font-semibold">Upload old Excel sheets to quickly populate trips, driver cash ledgers, maintenance and customer balances</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Config and Upload */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 h-fit shadow-sm">
          <h2 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Upload Configuration
          </h2>
          <p className="text-xs text-slate-450 font-medium">Select the layout type matching your Excel columns.</p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500">Import Target Registry</label>
              <select
                value={importType}
                onChange={(e) => {
                  setImportType(e.target.value);
                  setFileData([]);
                  setFileName("");
                }}
                className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
              >
                <option value="trips">Trips Records (.xlsx)</option>
                <option value="driver_cash">Driver Cash Advances (.xlsx)</option>
                <option value="salaries">Driver Salaries Payroll (.xlsx)</option>
                <option value="maintenance">Truck Maintenance Logs (.xlsx)</option>
              </select>
            </div>

            {/* Template specs */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-[11px] text-slate-500 space-y-2">
              <span className="font-bold text-slate-700">Expected Columns:</span>
              {importType === "trips" && (
                <div className="font-mono text-emerald-700">Customer, Driver, Truck, FromCountry, ToCountry, Amount, CargoType</div>
              )}
              {importType === "driver_cash" && (
                <div className="font-mono text-emerald-700">TripNumber, Amount, Date, PaymentMethod, Notes</div>
              )}
              {importType === "salaries" && (
                <div className="font-mono text-emerald-700">Driver, BaseSalary, Month, Year, Deductions, Notes</div>
              )}
              {importType === "maintenance" && (
                <div className="font-mono text-emerald-700">Truck, Amount, Date, Workshop, Notes</div>
              )}
            </div>

            {/* Drag & drop upload box */}
            <div className="relative border-2 border-dashed border-slate-350 hover:border-emerald-600 rounded-xl p-8 text-center transition cursor-pointer bg-slate-50/50 hover:bg-slate-50">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={loading}
              />
              <Upload className="h-8 w-8 text-slate-40 mx-auto mb-2 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700 block">
                {fileName ? fileName : "Choose Excel / CSV File"}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block font-medium">Drag and drop file here</span>
            </div>
          </div>
        </div>

        {/* Validation Dashboard Results */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-md font-bold text-slate-900">Pre-import Validation Preview</h2>
              <p className="text-xs text-slate-450 font-semibold">Live checks on records before executing insertions</p>
            </div>
            {fileData.length > 0 && getInvalidCount() === 0 && (
              <button
                onClick={handleSaveImport}
                disabled={loading}
                className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:brightness-105 flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
              >
                {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : null} Save Valid Records
              </button>
            )}
          </div>

          {successMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {fileData.length > 0 ? (
            <div className="space-y-4">
              {/* Stat breakdown */}
              <div className="grid grid-cols-2 gap-4 text-center font-medium">
                <div className="rounded-lg bg-emerald-50 border border-emerald-250 p-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Passed Records</span>
                  <div className="text-lg font-black text-emerald-700">{getValidCount()}</div>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-250 p-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Failed / Rejected</span>
                  <div className="text-lg font-black text-red-650">{getInvalidCount()}</div>
                </div>
              </div>

              {/* Warnings details */}
              {getInvalidCount() > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-650 text-xs flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                  <span>Fix identified structural errors in Excel sheets (color-coded red below) to proceed saving.</span>
                </div>
              )}

              {/* Table details */}
              <div className="overflow-x-auto max-h-[300px] border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-455 uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-3">Excel Row</th>
                      <th className="py-2.5 px-3">Import Columns Preview</th>
                      <th className="py-2.5 px-3 text-center">Validation Status</th>
                      <th className="py-2.5 px-3">Identified Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {fileData.map((row, idx) => (
                      <tr key={idx} className={row.status === "INVALID" ? "bg-red-50/50" : ""}>
                        <td className="py-2.5 px-3 font-mono text-slate-500">Row {row.rowNum}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {Object.entries(row.data)
                            .slice(0, 3)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" | ")}
                          {Object.keys(row.data).length > 3 ? "..." : ""}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              row.status === "VALID"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-655"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-red-655 font-bold">{row.errors.join(", ") || "None"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FileSpreadsheet className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold">No records queued. Upload an Excel spreadsheet to begin validation checks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
