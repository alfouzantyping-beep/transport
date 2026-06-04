"use client";

import { useState } from "react";
import { FileText, Download, RefreshCw } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("trip_profit");

  // Sample static high-fidelity data matching GCC logistics logs
  const tripProfitData = [
    { tripNum: "TRIP-2026-001", client: "Almarai Company", route: "UAE ➔ KSA", freight: 8500, cost: 1650, profit: 6850 },
    { tripNum: "TRIP-2026-002", client: "Emaar Properties", route: "UAE ➔ Oman", freight: 4200, cost: 1100, profit: 3100 },
    { tripNum: "TRIP-2026-003", client: "Kuwait Petroleum", route: "Kuwait ➔ UAE", freight: 12500, cost: 2450, profit: 10050 },
    { tripNum: "TRIP-2026-004", client: "Qatar Gas", route: "Qatar ➔ KSA", freight: 9800, cost: 1900, profit: 7900 },
  ];

  const driverCashData = [
    { driver: "Muhammad Khan", advancesIssued: 3500, expensesSettled: 3150, remainingAdvance: 350 },
    { driver: "Amrit Singh", advancesIssued: 1800, expensesSettled: 1800, remainingAdvance: 0 },
    { driver: "Sajid Khan", advancesIssued: 2500, expensesSettled: 2350, remainingAdvance: 150 },
  ];

  const truckProfitData = [
    { truck: "TRK-01-SHJ (Flatbed)", revenue: 21000, maintenanceCost: 1200, netTripProfit: 19800 },
    { truck: "TRK-02-DXB (Tanker)", revenue: 14000, maintenanceCost: 2800, netTripProfit: 11200 },
    { truck: "TRK-03-KSA (Reefer)", revenue: 9800, maintenanceCost: 850, netTripProfit: 8950 },
  ];

  const customerOutstandingData = [
    { client: "Almarai Company", invoiced: 28500, received: 20000, outstanding: 8500 },
    { client: "Emaar Properties", invoiced: 16200, received: 16200, outstanding: 0 },
    { client: "Kuwait Petroleum", invoiced: 44000, received: 30000, outstanding: 14000 },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Export to Excel handler
  const handleExportExcel = () => {
    let dataset: any[] = [];
    let name = "Report";

    if (activeTab === "trip_profit") {
      dataset = tripProfitData;
      name = "Trip_Profit_Report";
    } else if (activeTab === "driver_cash") {
      dataset = driverCashData;
      name = "Driver_Cash_Balances";
    } else if (activeTab === "truck_profit") {
      dataset = truckProfitData;
      name = "Truck_Profitability";
    } else if (activeTab === "customer_outstanding") {
      dataset = customerOutstandingData;
      name = "Customer_Outstanding_Balances";
    }

    const worksheet = XLSX.utils.json_to_sheet(dataset);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${name}.xlsx`);
  };

  // Export to PDF handler
  const handleExportPDF = () => {
    const doc = new jsPDF();
    let title = "GCC Transport ERP Report";
    let headers: string[] = [];
    let body: any[][] = [];

    if (activeTab === "trip_profit") {
      title = "Trip Profitability Audit Log";
      headers = ["Trip Number", "Customer Name", "Corridor Route", "Freight Amount", "Trip Costs", "Net Margin"];
      body = tripProfitData.map(d => [
        d.tripNum,
        d.client,
        d.route,
        formatCurrency(d.freight),
        formatCurrency(d.cost),
        formatCurrency(d.profit)
      ]);
    } else if (activeTab === "driver_cash") {
      title = "Driver Cash Outstanding Balances";
      headers = ["Driver Name", "Total Advances Given", "Total Expenses Settled", "Outstanding Balance"];
      body = driverCashData.map(d => [
        d.driver,
        formatCurrency(d.advancesIssued),
        formatCurrency(d.expensesSettled),
        formatCurrency(d.remainingAdvance)
      ]);
    } else if (activeTab === "truck_profit") {
      title = "Truck Profit & Fleet Performance Report";
      headers = ["Truck Details", "Total Earned Revenue", "Total Maintenance Cost", "Net Fleet Yield"];
      body = truckProfitData.map(d => [
        d.truck,
        formatCurrency(d.revenue),
        formatCurrency(d.maintenanceCost),
        formatCurrency(d.netTripProfit)
      ]);
    } else if (activeTab === "customer_outstanding") {
      title = "Customer Accounts Receivable Ledger";
      headers = ["Customer Name", "Total Invoiced Amount", "Total Payments Received", "Pending Balance"];
      body = customerOutstandingData.map(d => [
        d.client,
        formatCurrency(d.invoiced),
        formatCurrency(d.received),
        formatCurrency(d.outstanding)
      ]);
    }

    // PDF Scaffold
    doc.setFillColor(15, 23, 42); // dark slate bg
    doc.rect(0, 0, 210, 30, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("GULF LOGISTICS & TRANSPORT CO.", 15, 18);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 15, 45);

    autoTable(doc, {
      startY: 55,
      head: [headers],
      body: body,
      headStyles: { fillColor: [16, 185, 129] }, // emerald theme
      styles: { fontSize: 9 }
    });

    doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Interactive ERP Reports</h1>
          <p className="text-xs text-slate-455 font-semibold">Generate P&L spreadsheets, track truck margins and check outstanding receivables</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-slate-50 cursor-pointer shadow-sm"
          >
            <Download className="h-4 w-4" /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:brightness-105 cursor-pointer shadow-md shadow-emerald-600/10"
          >
            <FileText className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("trip_profit")}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "trip_profit"
              ? "border-emerald-600 text-emerald-700 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Trip Profitability
        </button>
        <button
          onClick={() => setActiveTab("driver_cash")}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "driver_cash"
              ? "border-emerald-600 text-emerald-700 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Driver Cash Balance
        </button>
        <button
          onClick={() => setActiveTab("truck_profit")}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "truck_profit"
              ? "border-emerald-600 text-emerald-700 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Truck Profitability
        </button>
        <button
          onClick={() => setActiveTab("customer_outstanding")}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "customer_outstanding"
              ? "border-emerald-600 text-emerald-700 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Customer Outstanding
        </button>
      </div>

      {/* Main Grid content */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Render Trip Profit */}
        {activeTab === "trip_profit" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-455 uppercase tracking-wider font-bold bg-slate-50/50">
                  <th className="py-3 px-4">Trip Code</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Route Corridor</th>
                  <th className="py-3 px-4 text-right">Trip Amount (Revenue)</th>
                  <th className="py-3 px-4 text-right">Trip Costs (Expenses)</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tripProfitData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-900 font-black">{row.tripNum}</td>
                    <td className="py-3 px-4 text-slate-900">{row.client}</td>
                    <td className="py-3 px-4 text-slate-700">{row.route}</td>
                    <td className="py-3 px-4 text-right text-slate-750">{formatCurrency(row.freight)}</td>
                    <td className="py-3 px-4 text-right text-red-600 font-semibold">{formatCurrency(row.cost)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-black">{formatCurrency(row.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Render Driver Cash */}
        {activeTab === "driver_cash" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-455 uppercase tracking-wider font-bold bg-slate-50/50">
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4 text-right">Total Advances Issued</th>
                  <th className="py-3 px-4 text-right">Total Expenses Settled</th>
                  <th className="py-3 px-4 text-right">Outstanding Wallet Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {driverCashData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-900 font-black">{row.driver}</td>
                    <td className="py-3 px-4 text-right text-slate-750">{formatCurrency(row.advancesIssued)}</td>
                    <td className="py-3 px-4 text-right text-slate-750">{formatCurrency(row.expensesSettled)}</td>
                    <td className="py-3 px-4 text-right text-amber-600 font-black">{formatCurrency(row.remainingAdvance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Render Truck Profit */}
        {activeTab === "truck_profit" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-455 uppercase tracking-wider font-bold bg-slate-50/50">
                  <th className="py-3 px-4">Truck Code / Plate</th>
                  <th className="py-3 px-4 text-right">Freight Revenue</th>
                  <th className="py-3 px-4 text-right">Maintenance Cost</th>
                  <th className="py-3 px-4 text-right">Net Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {truckProfitData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-900 font-black">{row.truck}</td>
                    <td className="py-3 px-4 text-right text-slate-750">{formatCurrency(row.revenue)}</td>
                    <td className="py-3 px-4 text-right text-red-655 font-semibold">{formatCurrency(row.maintenanceCost)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-bold">{formatCurrency(row.netTripProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Render Customer Outstanding */}
        {activeTab === "customer_outstanding" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-455 uppercase tracking-wider font-bold bg-slate-50/50">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4 text-right">Total Invoiced</th>
                  <th className="py-3 px-4 text-right">Total Received</th>
                  <th className="py-3 px-4 text-right">Pending Receivables</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {customerOutstandingData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-900 font-black">{row.client}</td>
                    <td className="py-3 px-4 text-right text-slate-750">{formatCurrency(row.invoiced)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700">{formatCurrency(row.received)}</td>
                    <td className="py-3 px-4 text-right text-amber-600 font-bold">{formatCurrency(row.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
