"use client";

import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  FileSpreadsheet,
  Edit,
  DollarSign,
  User,
  Calendar,
  Check,
  AlertCircle,
  TrendingUp,
  CreditCard,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface Driver {
  id: string;
  name: string;
  mobile: string;
  passport: string;
  emiratesId: string;
  license: string;
  salary: number;
  advanceBalance: number;
  visaBalance: number;
  status: string;
}

interface PettyCashRow {
  tripId: string;
  tripNumber: string;
  date: string;
  truckNumber: string;
  truckPlate: string;
  doNumber: string;
  clientName: string;
  loadingPoint: string;
  deliveryPoint: string;
  // 15 expense items
  qatarVisa: number;
  qatarToll: number;
  ksaVisa: number;
  uaeCustoms: number;
  ksaCustoms: number;
  mezan: number;
  jordanBorder: number;
  cameraFine: number;
  hayaPeshgi: number;
  toll: number;
  gatePass: number;
  diesel: number;
  food: number;
  border: number;
  maintenance: number;
  // totals
  pettyCashIssued: number;
  usedPettyCash: number;
  remainingBalance: number;
}

interface SalaryRow {
  id: string;
  date: string;
  month: number;
  year: number;
  baseSalary: number;
  roomDeduction: number;
  advanceDeduction: number;
  fineDeduction: number;
  visaDeduction: number;
  totalDeductions: number;
  netSalary: number;
  notes: string;
  status: string;
}

const monthsList = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function DriverLedgerPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  const [pettyCashLedger, setPettyCashLedger] = useState<PettyCashRow[]>([]);
  const [salaryLedger, setSalaryLedger] = useState<SalaryRow[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [activeTab, setActiveTab] = useState<"petty" | "salary">("petty");

  // Edit Expense/Cash Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTripId, setEditTripId] = useState("");
  const [editTripNum, setEditTripNum] = useState("");
  const [editPettyCash, setEditPettyCash] = useState("");
  const [editDiesel, setEditDiesel] = useState("");
  const [editFood, setEditFood] = useState("");
  const [editBorder, setEditBorder] = useState("");
  const [editMaintenance, setEditMaintenance] = useState("");
  const [editToll, setEditToll] = useState("");
  const [editQatarVisa, setEditQatarVisa] = useState("");
  const [editQatarToll, setEditQatarToll] = useState("");
  const [editKsaVisa, setEditKsaVisa] = useState("");
  const [editUaeCustoms, setEditUaeCustoms] = useState("");
  const [editKsaCustoms, setEditKsaCustoms] = useState("");
  const [editMezan, setEditMezan] = useState("");
  const [editJordanBorder, setEditJordanBorder] = useState("");
  const [editCameraFine, setEditCameraFine] = useState("");
  const [editHayaPeshgi, setEditHayaPeshgi] = useState("");
  const [editGatePass, setEditGatePass] = useState("");
  const [editNotes, setEditNotes] = useState("");
  
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Process Salary Modal State
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [salaryBase, setSalaryBase] = useState("");
  const [salaryAdvanceDec, setSalaryAdvanceDec] = useState("");
  const [salaryFineDec, setSalaryFineDec] = useState("");
  const [salaryVisaDec, setSalaryVisaDec] = useState("");
  const [salaryRoomDec, setSalaryRoomDec] = useState("");
  const [salaryDate, setSalaryDate] = useState("");
  const [salaryNotes, setSalaryNotes] = useState("");
  const [savingSalary, setSavingSalary] = useState(false);
  const [salaryError, setSalaryError] = useState("");

  // Load drivers on mount
  useEffect(() => {
    const fetchDriversList = async () => {
      try {
        setLoadingDrivers(true);
        const res = await fetch("/api/drivers");
        if (res.ok) {
          const data = await res.json();
          setDrivers(data.data);
        }
      } catch (err) {
        console.error("Failed to load drivers", err);
      } finally {
        setLoadingDrivers(false);
      }
    };
    fetchDriversList();
  }, []);

  // Fetch ledger when selected driver changes
  const fetchLedger = async (driverId: string) => {
    if (!driverId) {
      setDriverProfile(null);
      setPettyCashLedger([]);
      setSalaryLedger([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/drivers/${driverId}/ledger`);
      if (res.ok) {
        const data = await res.json();
        setDriverProfile(data.driver);
        setPettyCashLedger(data.pettyCashLedger);
        setSalaryLedger(data.salaryLedger);
      }
    } catch (err) {
      console.error("Error loading driver ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger(selectedDriverId);
  }, [selectedDriverId]);

  // Open edit modal pre-filled
  const handleOpenEdit = (row: PettyCashRow) => {
    setEditTripId(row.tripId);
    setEditTripNum(row.tripNumber);
    setEditPettyCash(row.pettyCashIssued.toString());
    setEditDiesel(row.diesel.toString());
    setEditFood(row.food.toString());
    setEditBorder(row.border.toString());
    setEditMaintenance(row.maintenance.toString());
    setEditToll(row.toll.toString());
    setEditQatarVisa(row.qatarVisa.toString());
    setEditQatarToll(row.qatarToll.toString());
    setEditKsaVisa(row.ksaVisa.toString());
    setEditUaeCustoms(row.uaeCustoms.toString());
    setEditKsaCustoms(row.ksaCustoms.toString());
    setEditMezan(row.mezan.toString());
    setEditJordanBorder(row.jordanBorder.toString());
    setEditCameraFine(row.cameraFine.toString());
    setEditHayaPeshgi(row.hayaPeshgi.toString());
    setEditGatePass(row.gatePass.toString());
    setEditNotes("");
    setEditError("");
    setShowEditModal(true);
  };

  // Submit edit ledger details
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError("");

    try {
      const res = await fetch(`/api/trips/${editTripId}/ledger-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pettyCash: parseFloat(editPettyCash || "0"),
          diesel: parseFloat(editDiesel || "0"),
          food: parseFloat(editFood || "0"),
          border: parseFloat(editBorder || "0"),
          maintenance: parseFloat(editMaintenance || "0"),
          toll: parseFloat(editToll || "0"),
          qatarVisa: parseFloat(editQatarVisa || "0"),
          qatarToll: parseFloat(editQatarToll || "0"),
          ksaVisa: parseFloat(editKsaVisa || "0"),
          uaeCustoms: parseFloat(editUaeCustoms || "0"),
          ksaCustoms: parseFloat(editKsaCustoms || "0"),
          mezan: parseFloat(editMezan || "0"),
          jordanBorder: parseFloat(editJordanBorder || "0"),
          cameraFine: parseFloat(editCameraFine || "0"),
          hayaPeshgi: parseFloat(editHayaPeshgi || "0"),
          gatePass: parseFloat(editGatePass || "0"),
          notes: editNotes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save changes");
      }

      setShowEditModal(false);
      // Refresh
      fetchLedger(selectedDriverId);
    } catch (err: any) {
      setEditError(err.message || "An error occurred while saving.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Open salary modal prefilled
  const handleOpenSalaryModal = () => {
    if (!driverProfile) return;
    setSalaryBase(driverProfile.salary.toString());
    setSalaryAdvanceDec(driverProfile.advanceBalance.toString());
    setSalaryVisaDec(driverProfile.visaBalance.toString());
    setSalaryRoomDec("0");
    setSalaryFineDec("0");
    setSalaryDate(new Date().toISOString().substring(0, 10));
    setSalaryNotes(`Salary for ${monthsList[salaryMonth - 1]} ${salaryYear}`);
    setSalaryError("");
    setShowSalaryModal(true);
  };

  // Submit salary payment
  const handleSubmitSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSalary(true);
    setSalaryError("");

    try {
      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriverId,
          month: salaryMonth,
          year: salaryYear,
          baseSalary: parseFloat(salaryBase),
          advanceDeduction: parseFloat(salaryAdvanceDec || "0"),
          fineDeduction: parseFloat(salaryFineDec || "0"),
          visaDeduction: parseFloat(salaryVisaDec || "0"),
          roomDeduction: parseFloat(salaryRoomDec || "0"),
          paymentDate: salaryDate,
          notes: salaryNotes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process salary slip");
      }

      setShowSalaryModal(false);
      fetchLedger(selectedDriverId);
    } catch (err: any) {
      setSalaryError(err.message || "An error occurred processing payroll.");
    } finally {
      setSavingSalary(false);
    }
  };

  // Excel exporter
  const exportToExcel = () => {
    if (!driverProfile) return;

    const fileType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";

    if (activeTab === "petty") {
      // Format Petty Cash Table
      const dataToExport = pettyCashLedger.map((row) => ({
        Date: format(new Date(row.date), "dd/MM/yyyy"),
        Truck: row.truckPlate,
        "DO No": row.doNumber,
        Client: row.clientName,
        Loading: row.loadingPoint,
        Delivery: row.deliveryPoint,
        "Qatar Visa": row.qatarVisa,
        "Qatar Ins": row.qatarToll,
        "KSA Visa": row.ksaVisa,
        "UAE Customs": row.uaeCustoms,
        "KSA Customs": row.ksaCustoms,
        Mezan: row.mezan,
        "Jordan Border": row.jordanBorder,
        "Camera Fine": row.cameraFine,
        "Haya/Peshgi": row.hayaPeshgi,
        "Toll Gate": row.toll,
        "Gate Pass": row.gatePass,
        Diesel: row.diesel,
        Food: row.food,
        Border: row.border,
        Maintenance: row.maintenance,
        "Petty Cash Issued": row.pettyCashIssued,
        "Used Petty Cash": row.usedPettyCash,
        "Remaining Balance": row.remainingBalance,
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = { Sheets: { "Petty Cash Ledger": ws }, SheetNames: ["Petty Cash Ledger"] };
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: fileType });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${driverProfile.name.replace(/\s+/g, "_")}_PettyCash_Ledger${fileExtension}`;
      link.click();
    } else {
      // Format Salary Table
      const dataToExport = salaryLedger.map((row) => ({
        Date: format(new Date(row.date), "dd/MM/yyyy"),
        Month: monthsList[row.month - 1],
        Year: row.year,
        "Base Salary": row.baseSalary,
        Room: row.roomDeduction,
        "Advance Deduction": row.advanceDeduction,
        "Traffic Fine": row.fineDeduction,
        "Visa Deduction": row.visaDeduction,
        "Total Deduction": row.totalDeductions,
        "Net Salary Transferred": row.netSalary,
        Notes: row.notes,
        Status: row.status,
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = { Sheets: { "Salary Ledger": ws }, SheetNames: ["Salary Ledger"] };
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: fileType });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${driverProfile.name.replace(/\s+/g, "_")}_Salary_Ledger${fileExtension}`;
      link.click();
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Deductions calculation helper
  const getSalaryDeductionTotal = () => {
    const adv = parseFloat(salaryAdvanceDec || "0");
    const fine = parseFloat(salaryFineDec || "0");
    const visa = parseFloat(salaryVisaDec || "0");
    const room = parseFloat(salaryRoomDec || "0");
    return adv + fine + visa + room;
  };

  const getSalaryNetTotal = () => {
    const base = parseFloat(salaryBase || "0");
    return base - getSalaryDeductionTotal();
  };

  // Sum helpers for Petty Cash Ledger
  const pettyCashSums = {
    qatarVisa: pettyCashLedger.reduce((sum, r) => sum + r.qatarVisa, 0),
    qatarToll: pettyCashLedger.reduce((sum, r) => sum + r.qatarToll, 0),
    ksaVisa: pettyCashLedger.reduce((sum, r) => sum + r.ksaVisa, 0),
    uaeCustoms: pettyCashLedger.reduce((sum, r) => sum + r.uaeCustoms, 0),
    ksaCustoms: pettyCashLedger.reduce((sum, r) => sum + r.ksaCustoms, 0),
    mezan: pettyCashLedger.reduce((sum, r) => sum + r.mezan, 0),
    jordanBorder: pettyCashLedger.reduce((sum, r) => sum + r.jordanBorder, 0),
    cameraFine: pettyCashLedger.reduce((sum, r) => sum + r.cameraFine, 0),
    hayaPeshgi: pettyCashLedger.reduce((sum, r) => sum + r.hayaPeshgi, 0),
    toll: pettyCashLedger.reduce((sum, r) => sum + r.toll, 0),
    gatePass: pettyCashLedger.reduce((sum, r) => sum + r.gatePass, 0),
    diesel: pettyCashLedger.reduce((sum, r) => sum + r.diesel, 0),
    food: pettyCashLedger.reduce((sum, r) => sum + r.food, 0),
    border: pettyCashLedger.reduce((sum, r) => sum + r.border, 0),
    maintenance: pettyCashLedger.reduce((sum, r) => sum + r.maintenance, 0),
    pettyCashIssued: pettyCashLedger.reduce((sum, r) => sum + r.pettyCashIssued, 0),
    usedPettyCash: pettyCashLedger.reduce((sum, r) => sum + r.usedPettyCash, 0),
  };

  // Sum helpers for Salary Ledger
  const salarySums = {
    baseSalary: salaryLedger.reduce((sum, r) => sum + r.baseSalary, 0),
    roomDeduction: salaryLedger.reduce((sum, r) => sum + r.roomDeduction, 0),
    advanceDeduction: salaryLedger.reduce((sum, r) => sum + r.advanceDeduction, 0),
    fineDeduction: salaryLedger.reduce((sum, r) => sum + r.fineDeduction, 0),
    visaDeduction: salaryLedger.reduce((sum, r) => sum + r.visaDeduction, 0),
    totalDeductions: salaryLedger.reduce((sum, r) => sum + r.totalDeductions, 0),
    netSalary: salaryLedger.reduce((sum, r) => sum + r.netSalary, 0),
  };

  const latestRemainingBalance = pettyCashLedger.length > 0 
    ? pettyCashLedger[pettyCashLedger.length - 1].remainingBalance 
    : 0;

  return (
    <div className="space-y-6">
      {/* Upper Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Driver Ledger & Excel Automation</h1>
          <p className="text-xs text-slate-450 font-semibold">
            Track driver cash statements, calculate running balances automatically, and process monthly payroll deductions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {driverProfile && (
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-650 hover:bg-slate-50 transition cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export current sheet
            </button>
          )}

          {activeTab === "salary" && driverProfile && (
            <button
              onClick={handleOpenSalaryModal}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
            >
              <UserCheck className="h-4 w-4" /> Issue Payslip Ledger
            </button>
          )}
        </div>
      </div>

      {/* Driver Selector & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selector Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Select Driver Ledger</label>
            {loadingDrivers ? (
              <div className="flex items-center gap-2 py-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                <span className="text-xs text-slate-500 font-medium">Loading drivers...</span>
              </div>
            ) : (
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full rounded-xl border border-slate-250 bg-white px-3 py-3 text-xs text-slate-900 font-black focus:outline-none focus:border-emerald-600"
              >
                <option value="">-- Select Profile --</option>
                {drivers.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.name} ({drv.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {driverProfile && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile:</span>
                <span className="text-slate-800">{driverProfile.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emirates ID:</span>
                <span className="text-slate-800">{driverProfile.emiratesId || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Passport:</span>
                <span className="text-slate-800">{driverProfile.passport || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">License:</span>
                <span className="text-slate-800 truncate max-w-[130px]" title={driverProfile.license}>{driverProfile.license}</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Stats Summary Cards */}
        {driverProfile ? (
          <>
            {/* Card 1: Petty Cash Statement */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Petty Cash Status</span>
                <TrendingUp className="h-5 w-5 text-emerald-600 bg-emerald-50 p-1 rounded-lg" />
              </div>
              <div className="my-2">
                <h3 className={`text-2xl font-black ${latestRemainingBalance >= 0 ? "text-slate-900" : "text-rose-650"}`}>
                  {formatCurrency(latestRemainingBalance)}
                </h3>
                <p className="text-[10px] text-slate-450 font-bold mt-1 uppercase tracking-wide">
                  Cumulative Running Balance
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-550 border-t border-slate-100 pt-2.5 mt-2">
                <span>Issued: {formatCurrency(pettyCashSums.pettyCashIssued)}</span>
                <span>Used: {formatCurrency(pettyCashSums.usedPettyCash)}</span>
              </div>
            </div>

            {/* Card 2: Advance Balance */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Outstanding Cash Advance</span>
                <DollarSign className="h-5 w-5 text-amber-600 bg-amber-50 p-1 rounded-lg" />
              </div>
              <div className="my-2">
                <h3 className="text-2xl font-black text-slate-900">
                  {formatCurrency(driverProfile.advanceBalance)}
                </h3>
                <p className="text-[10px] text-slate-450 font-bold mt-1 uppercase tracking-wide">
                  Deductions Balance
                </p>
              </div>
              <div className="text-[10px] font-semibold text-slate-400 border-t border-slate-100 pt-2.5 mt-2">
                Pending payroll salary settlement
              </div>
            </div>

            {/* Card 3: Visa / Base Salary */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Visa & Salary Base</span>
                <CreditCard className="h-5 w-5 text-blue-600 bg-blue-50 p-1 rounded-lg" />
              </div>
              <div className="my-2">
                <h3 className="text-2xl font-black text-slate-900">
                  {formatCurrency(driverProfile.salary)}
                </h3>
                <p className="text-[10px] text-slate-450 font-bold mt-1 uppercase tracking-wide">
                  Base Salary per month
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-550 border-t border-slate-100 pt-2.5 mt-2">
                <span>Visa Balance: {formatCurrency(driverProfile.visaBalance)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-3 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <User className="h-10 w-10 text-slate-350 bg-slate-50 p-2 rounded-2xl mb-2.5" />
            <h4 className="text-sm font-black text-slate-800">No driver profile selected</h4>
            <p className="text-xs text-slate-450 font-medium max-w-sm mt-1">
              Please choose a driver from the dropdown to automatically generate their Petty Cash and Salary ledgers
            </p>
          </div>
        )}
      </div>

      {/* Main Ledger Content Tabs */}
      {driverProfile && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Tab Selection */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("petty")}
                className={`rounded-lg px-4 py-2 text-xs font-black tracking-wide transition cursor-pointer ${
                  activeTab === "petty"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-650 hover:bg-slate-100"
                }`}
              >
                Petty Cash Ledger
              </button>
              <button
                onClick={() => setActiveTab("salary")}
                className={`rounded-lg px-4 py-2 text-xs font-black tracking-wide transition cursor-pointer ${
                  activeTab === "salary"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-650 hover:bg-slate-100"
                }`}
              >
                Salary Ledger
              </button>
            </div>
            
            <button
              onClick={() => fetchLedger(selectedDriverId)}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Table grids */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : activeTab === "petty" ? (
              /* Petty Cash Grid */
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm scrollbar-thin">
                  <table className="w-full text-left border-collapse table-fixed min-w-[2400px]">
                    <thead>
                      <tr className="border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-550 bg-slate-50/70">
                        <th className="py-3 px-3 w-[100px]">Date</th>
                        <th className="py-3 px-3 w-[120px]">Truck</th>
                        <th className="py-3 px-3 w-[100px]">DO No</th>
                        <th className="py-3 px-3 w-[180px]">Client</th>
                        <th className="py-3 px-3 w-[150px]">Loading</th>
                        <th className="py-3 px-3 w-[150px]">Delivery</th>
                        {/* 15 Expense columns */}
                        <th className="py-3 px-2 text-right bg-emerald-50/30 text-emerald-800 w-[80px]">Qatar Visa</th>
                        <th className="py-3 px-2 text-right bg-emerald-50/30 text-emerald-800 w-[90px]">Qatar Ins</th>
                        <th className="py-3 px-2 text-right bg-emerald-50/30 text-emerald-800 w-[80px]">KSA Visa</th>
                        <th className="py-3 px-2 text-right bg-blue-50/20 text-blue-900 w-[95px]">UAE Customs</th>
                        <th className="py-3 px-2 text-right bg-blue-50/20 text-blue-900 w-[95px]">KSA Customs</th>
                        <th className="py-3 px-2 text-right w-[75px]">Mezan</th>
                        <th className="py-3 px-2 text-right w-[95px]">Jordan Bdr</th>
                        <th className="py-3 px-2 text-right text-rose-800 bg-rose-50/10 w-[90px]">Camera Fine</th>
                        <th className="py-3 px-2 text-right w-[90px]">Haya/Peshgi</th>
                        <th className="py-3 px-2 text-right w-[90px]">Toll Gate</th>
                        <th className="py-3 px-2 text-right w-[85px]">Gate Pass</th>
                        <th className="py-3 px-2 text-right bg-amber-50/20 text-amber-900 w-[80px]">Diesel</th>
                        <th className="py-3 px-2 text-right w-[80px]">Food</th>
                        <th className="py-3 px-2 text-right w-[80px]">Border</th>
                        <th className="py-3 px-2 text-right w-[95px]">Maintenance</th>
                        
                        <th className="py-3 px-3 text-right bg-indigo-50/50 text-indigo-900 w-[110px]">Petty Cash</th>
                        <th className="py-3 px-3 text-right bg-rose-50/40 text-rose-900 w-[110px]">Used Petty</th>
                        <th className="py-3 px-3 text-right bg-slate-100 text-slate-800 w-[110px]">Rem Balance</th>
                        <th className="py-3 px-3 text-center w-[80px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-[11px] font-medium text-slate-700">
                      {pettyCashLedger.length === 0 ? (
                        <tr>
                          <td colSpan={25} className="py-12 text-center text-slate-450 font-bold text-xs">
                            No trip ledger records found for this driver.
                          </td>
                        </tr>
                      ) : (
                        pettyCashLedger.map((row) => (
                          <tr key={row.tripId} className="hover:bg-slate-50/60 transition">
                            <td className="py-2.5 px-3 text-slate-500 font-bold">
                              {format(new Date(row.date), "dd/MM/yyyy")}
                            </td>
                            <td className="py-2.5 px-3 text-slate-900 font-black truncate">{row.truckPlate}</td>
                            <td className="py-2.5 px-3 text-slate-800 font-semibold">{row.doNumber}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-semibold truncate" title={row.clientName}>{row.clientName}</td>
                            <td className="py-2.5 px-3 text-slate-500 truncate" title={row.loadingPoint}>{row.loadingPoint}</td>
                            <td className="py-2.5 px-3 text-slate-500 truncate" title={row.deliveryPoint}>{row.deliveryPoint}</td>
                            {/* Expenses */}
                            <td className="py-2.5 px-2 text-right bg-emerald-50/20 font-semibold text-slate-800">{row.qatarVisa || "-"}</td>
                            <td className="py-2.5 px-2 text-right bg-emerald-50/20 font-semibold text-slate-800">{row.qatarToll || "-"}</td>
                            <td className="py-2.5 px-2 text-right bg-emerald-50/20 font-semibold text-slate-800">{row.ksaVisa || "-"}</td>
                            <td className="py-2.5 px-2 text-right bg-blue-50/10 font-semibold text-slate-800">{row.uaeCustoms || "-"}</td>
                            <td className="py-2.5 px-2 text-right bg-blue-50/10 font-semibold text-slate-800">{row.ksaCustoms || "-"}</td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{row.mezan || "-"}</td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{row.jordanBorder || "-"}</td>
                            <td className="py-2.5 px-2 text-right text-rose-700 bg-rose-50/5 font-semibold">{row.cameraFine || "-"}</td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{row.hayaPeshgi || "-"}</td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{row.toll || "-"}</td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{row.gatePass || "-"}</td>
                            <td className="py-2.5 px-2 text-right bg-amber-50/10 font-semibold text-slate-800">{row.diesel || "-"}</td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{row.food || "-"}</td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{row.border || "-"}</td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{row.maintenance || "-"}</td>
                            {/* Totals */}
                            <td className="py-2.5 px-3 text-right bg-indigo-50/30 text-indigo-950 font-black">{row.pettyCashIssued || "-"}</td>
                            <td className="py-2.5 px-3 text-right bg-rose-50/30 text-rose-950 font-black">{row.usedPettyCash || "-"}</td>
                            <td className={`py-2.5 px-3 text-right font-black ${
                              row.remainingBalance >= 0 ? "bg-emerald-50/30 text-emerald-950" : "bg-rose-100/40 text-rose-700"
                            }`}>
                              {row.remainingBalance}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleOpenEdit(row)}
                                className="rounded-lg p-1.5 text-slate-450 hover:bg-slate-100 hover:text-emerald-600 transition cursor-pointer"
                                title="Edit Ledger Row"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}

                      {/* Totals Row */}
                      {pettyCashLedger.length > 0 && (
                        <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300">
                          <td colSpan={6} className="py-3 px-3 text-left uppercase text-[9px] tracking-widest text-slate-500 font-extrabold">Sheet Totals (AED)</td>
                          <td className="py-3 px-2 text-right bg-emerald-50/50">{pettyCashSums.qatarVisa}</td>
                          <td className="py-3 px-2 text-right bg-emerald-50/50">{pettyCashSums.qatarToll}</td>
                          <td className="py-3 px-2 text-right bg-emerald-50/50">{pettyCashSums.ksaVisa}</td>
                          <td className="py-3 px-2 text-right bg-blue-50/30">{pettyCashSums.uaeCustoms}</td>
                          <td className="py-3 px-2 text-right bg-blue-50/30">{pettyCashSums.ksaCustoms}</td>
                          <td className="py-3 px-2 text-right">{pettyCashSums.mezan}</td>
                          <td className="py-3 px-2 text-right">{pettyCashSums.jordanBorder}</td>
                          <td className="py-3 px-2 text-right bg-rose-50/10 text-rose-700">{pettyCashSums.cameraFine}</td>
                          <td className="py-3 px-2 text-right">{pettyCashSums.hayaPeshgi}</td>
                          <td className="py-3 px-2 text-right">{pettyCashSums.toll}</td>
                          <td className="py-3 px-2 text-right">{pettyCashSums.gatePass}</td>
                          <td className="py-3 px-2 text-right bg-amber-50/30">{pettyCashSums.diesel}</td>
                          <td className="py-3 px-2 text-right">{pettyCashSums.food}</td>
                          <td className="py-3 px-2 text-right">{pettyCashSums.border}</td>
                          <td className="py-3 px-2 text-right">{pettyCashSums.maintenance}</td>
                          
                          <td className="py-3 px-3 text-right bg-indigo-50/70 text-indigo-900 font-extrabold">{pettyCashSums.pettyCashIssued}</td>
                          <td className="py-3 px-3 text-right bg-rose-50/50 text-rose-900 font-extrabold">{pettyCashSums.usedPettyCash}</td>
                          <td className={`py-3 px-3 text-right font-extrabold ${latestRemainingBalance >= 0 ? "bg-emerald-50/60 text-emerald-950" : "bg-rose-100/60 text-rose-700"}`}>
                            {latestRemainingBalance}
                          </td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Salary Ledger Grid */
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm scrollbar-thin">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-slate-150 text-xs font-bold uppercase tracking-wider text-slate-455 bg-slate-50/50">
                        <th className="py-3 px-4">Date Processed</th>
                        <th className="py-3 px-4">Salary Month</th>
                        <th className="py-3 px-4 text-right">Base Salary</th>
                        <th className="py-3 px-4 text-right">Room Rent</th>
                        <th className="py-3 px-4 text-right">Advance Dec</th>
                        <th className="py-3 px-4 text-right">Traffic Fine</th>
                        <th className="py-3 px-4 text-right">Visa Dec</th>
                        <th className="py-3 px-4 text-right text-rose-750 bg-rose-50/10">Total Deductions</th>
                        <th className="py-3 px-4 text-right text-emerald-750 bg-emerald-50/10">Final Settle Salary</th>
                        <th className="py-3 px-4">Payment Notes</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {salaryLedger.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-slate-450 font-bold">
                            No monthly salary ledgers logged for this driver.
                          </td>
                        </tr>
                      ) : (
                        salaryLedger.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4 text-slate-500 font-bold">
                              {format(new Date(row.date), "dd MMM yyyy")}
                            </td>
                            <td className="py-3 px-4 text-slate-900 font-black">
                              {monthsList[row.month - 1]} {row.year}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-700 font-semibold">{formatCurrency(row.baseSalary)}</td>
                            <td className="py-3 px-4 text-right text-slate-600">-{formatCurrency(row.roomDeduction)}</td>
                            <td className="py-3 px-4 text-right text-slate-600">-{formatCurrency(row.advanceDeduction)}</td>
                            <td className="py-3 px-4 text-right text-slate-600">-{formatCurrency(row.fineDeduction)}</td>
                            <td className="py-3 px-4 text-right text-slate-600">-{formatCurrency(row.visaDeduction)}</td>
                            <td className="py-3 px-4 text-right text-rose-650 bg-rose-50/5 font-black">
                              -{formatCurrency(row.totalDeductions)}
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-700 bg-emerald-50/5 font-black text-sm">
                              {formatCurrency(row.netSalary)}
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-medium truncate max-w-xs">{row.notes || "-"}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-250">
                                <Check className="h-3 w-3" /> PAID
                              </span>
                            </td>
                          </tr>
                        ))
                      )}

                      {/* Totals Row */}
                      {salaryLedger.length > 0 && (
                        <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300 text-xs">
                          <td colSpan={2} className="py-3 px-4 text-left uppercase text-[10px] tracking-widest text-slate-500 font-extrabold">Sheet Totals (AED)</td>
                          <td className="py-3 px-4 text-right font-black">{formatCurrency(salarySums.baseSalary)}</td>
                          <td className="py-3 px-4 text-right font-semibold">-{formatCurrency(salarySums.roomDeduction)}</td>
                          <td className="py-3 px-4 text-right font-semibold">-{formatCurrency(salarySums.advanceDeduction)}</td>
                          <td className="py-3 px-4 text-right font-semibold">-{formatCurrency(salarySums.fineDeduction)}</td>
                          <td className="py-3 px-4 text-right font-semibold">-{formatCurrency(salarySums.visaDeduction)}</td>
                          <td className="py-3 px-4 text-right bg-rose-50/30 text-rose-700 font-black">-{formatCurrency(salarySums.totalDeductions)}</td>
                          <td className="py-3 px-4 text-right bg-emerald-50/30 text-emerald-800 font-black">{formatCurrency(salarySums.netSalary)}</td>
                          <td colSpan={3}></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Entry Modal Popup */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900 mb-1">Modify Trip Ledger: {editTripNum}</h2>
            <p className="text-xs text-slate-400 font-medium mb-4">Edit Petty Cash and granular road expenses for this trip. The running balances will update instantly.</p>

            {editError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-650 font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              {/* Cash given field */}
              <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-xl p-4">
                <label className="text-xs font-black text-indigo-950 uppercase tracking-wide">Petty Cash Issued (AED)</label>
                <input
                  type="number"
                  value={editPettyCash}
                  onChange={(e) => setEditPettyCash(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 font-black focus:outline-none focus:border-indigo-500"
                  placeholder="0"
                />
              </div>

              {/* 15 Custom Expenses Grid */}
              <div className="border-t border-slate-100 pt-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Granular Expense Entries (AED)</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Qatar Visa</label>
                    <input
                      type="number"
                      value={editQatarVisa}
                      onChange={(e) => setEditQatarVisa(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Qatar Ins</label>
                    <input
                      type="number"
                      value={editQatarToll}
                      onChange={(e) => setEditQatarToll(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-455 uppercase">KSA Visa</label>
                    <input
                      type="number"
                      value={editKsaVisa}
                      onChange={(e) => setEditKsaVisa(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">UAE Customs</label>
                    <input
                      type="number"
                      value={editUaeCustoms}
                      onChange={(e) => setEditUaeCustoms(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">KSA Customs</label>
                    <input
                      type="number"
                      value={editKsaCustoms}
                      onChange={(e) => setEditKsaCustoms(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Mezan</label>
                    <input
                      type="number"
                      value={editMezan}
                      onChange={(e) => setEditMezan(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Jordan Border</label>
                    <input
                      type="number"
                      value={editJordanBorder}
                      onChange={(e) => setEditJordanBorder(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 text-rose-700 uppercase">Camera Fine</label>
                    <input
                      type="number"
                      value={editCameraFine}
                      onChange={(e) => setEditCameraFine(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold text-rose-700"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Haya / Peshgi</label>
                    <input
                      type="number"
                      value={editHayaPeshgi}
                      onChange={(e) => setEditHayaPeshgi(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Toll Gate</label>
                    <input
                      type="number"
                      value={editToll}
                      onChange={(e) => setEditToll(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Gate Pass</label>
                    <input
                      type="number"
                      value={editGatePass}
                      onChange={(e) => setEditGatePass(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Diesel</label>
                    <input
                      type="number"
                      value={editDiesel}
                      onChange={(e) => setEditDiesel(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Food</label>
                    <input
                      type="number"
                      value={editFood}
                      onChange={(e) => setEditFood(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Border</label>
                    <input
                      type="number"
                      value={editBorder}
                      onChange={(e) => setEditBorder(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Maintenance</label>
                    <input
                      type="number"
                      value={editMaintenance}
                      onChange={(e) => setEditMaintenance(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">Edit Notes / Remarks</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 h-16 resize-none"
                  placeholder="Reason for change..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 font-bold">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:brightness-105 cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? "Updating..." : "Save Ledger Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Payslip Process Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900 mb-1">Issue Payroll Salary Ledger</h2>
            <p className="text-xs text-slate-400 font-medium mb-4">Calculate deductions and commit salary ledger payout for this driver.</p>

            {salaryError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-655 font-semibold">
                {salaryError}
              </div>
            )}

            <form onSubmit={handleSubmitSalary} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Payroll Month</label>
                  <select
                    value={salaryMonth}
                    onChange={(e) => setSalaryMonth(parseInt(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    {monthsList.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Payroll Year</label>
                  <select
                    value={salaryYear}
                    onChange={(e) => setSalaryYear(parseInt(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500">Base Salary (AED) *</label>
                  <input
                    type="number"
                    required
                    value={salaryBase}
                    onChange={(e) => setSalaryBase(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={salaryDate}
                    onChange={(e) => setSalaryDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>

                {/* Deductions */}
                <div className="col-span-2 border-t border-slate-200 pt-2 mt-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Salary Deductions</h3>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-550">Advance Balance Dec (AED)</label>
                  <input
                    type="number"
                    value={salaryAdvanceDec}
                    onChange={(e) => setSalaryAdvanceDec(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-550">Traffic Fines / Challan (AED)</label>
                  <input
                    type="number"
                    value={salaryFineDec}
                    onChange={(e) => setSalaryFineDec(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-550">Visa Cost Dec (AED)</label>
                  <input
                    type="number"
                    value={salaryVisaDec}
                    onChange={(e) => setSalaryVisaDec(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-550">Room Rent Dec (AED)</label>
                  <input
                    type="number"
                    value={salaryRoomDec}
                    onChange={(e) => setSalaryRoomDec(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>

                {/* Net Salary Preview */}
                <div className="col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-4 flex justify-between items-center mt-2 font-bold text-sm">
                  <span className="text-slate-550">Final Salary (Net payout):</span>
                  <span className="text-emerald-600 text-lg">{formatCurrency(getSalaryNetTotal())}</span>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500">Transaction Notes / Reference</label>
                  <textarea
                    value={salaryNotes}
                    onChange={(e) => setSalaryNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 h-16 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 font-semibold">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSalary}
                  className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:brightness-105 cursor-pointer disabled:opacity-50"
                >
                  {savingSalary ? "Issuing..." : "Confirm & Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
