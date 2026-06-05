import type { ImportType } from "@/app/generated/prisma/client";

export type ImportField = {
  key: string;
  label: string;
  required?: boolean;
};

export type ImportConfig = {
  type: ImportType;
  title: string;
  description: string;
  path: string;
  expectedColumns: string[];
  fields: ImportField[];
};

export const expenseColumns = [
  ["Diesel", "Diesel"],
  ["Food", "Food"],
  ["Border", "Border Charges"],
  ["Visa", "Visa"],
  ["Customs", "Customs"],
  ["Toll Gate", "Toll"],
  ["Gate Pass", "Gate Pass"],
  ["Maintenance", "Maintenance"],
  ["Qatar Visa", "Qatar Visa"],
  ["Qatar Insurance", "Qatar Insurance"],
  ["KSA Visa", "KSA Visa"],
  ["UAE Custom", "UAE Custom"],
  ["KSA Custom", "KSA Custom"],
  ["Mezan", "Mezan"],
  ["Camera X", "Camera Fine"],
  ["Washing", "Washing"],
  ["Other", "Other"],
] as const;

export const importConfigs: Record<string, ImportConfig> = {
  trips: {
    type: "TRIPS",
    title: "Trip Excel Import",
    description: "Import old trip records after validating driver, truck, and customer names.",
    path: "/import/trips",
    expectedColumns: ["Date", "Driver", "Truck", "DO No", "Client", "Loading", "Loading To", "Trip Amount"],
    fields: [
      { key: "tripDate", label: "Date", required: true },
      { key: "driver", label: "Driver", required: true },
      { key: "truck", label: "Truck", required: true },
      { key: "doNumber", label: "DO No", required: true },
      { key: "customer", label: "Client", required: true },
      { key: "loadingPoint", label: "Loading", required: true },
      { key: "deliveryPoint", label: "Loading To", required: true },
      { key: "tripAmount", label: "Trip Amount", required: true },
    ],
  },
  "driver-cash": {
    type: "DRIVER_CASH",
    title: "Driver Cash Excel Import",
    description: "Create cash advance records from old petty cash sheets.",
    path: "/import/driver-cash",
    expectedColumns: ["Date", "Driver", "Truck", "Trip/DO No", "Petty Cash", "Used Petty Cash", "Remaining Balance"],
    fields: [
      { key: "cashDate", label: "Date", required: true },
      { key: "driver", label: "Driver", required: true },
      { key: "truck", label: "Truck", required: true },
      { key: "tripRef", label: "Trip/DO No", required: true },
      { key: "pettyCash", label: "Petty Cash", required: true },
      { key: "usedPettyCash", label: "Used Petty Cash" },
      { key: "remainingBalance", label: "Remaining Balance" },
    ],
  },
  "trip-expenses": {
    type: "DRIVER_CASH",
    title: "Trip Expenses Excel Import",
    description: "Create separate trip expense rows from petty cash amount columns.",
    path: "/import/trip-expenses",
    expectedColumns: ["Date", "Driver", "Truck", "Trip/DO No", ...expenseColumns.map(([column]) => column)],
    fields: [
      { key: "expenseDate", label: "Date", required: true },
      { key: "driver", label: "Driver", required: true },
      { key: "truck", label: "Truck", required: true },
      { key: "tripRef", label: "Trip/DO No", required: true },
      ...expenseColumns.map(([column]) => ({ key: column, label: column })),
    ],
  },
  salaries: {
    type: "SALARIES",
    title: "Salary Excel Import",
    description: "Import old monthly salary records with deductions and payment status.",
    path: "/import/salaries",
    expectedColumns: ["Month", "Driver", "Basic Salary", "Room", "Advance", "Traffic Fine", "Visa Balance", "Deduction", "Final Salary", "Status"],
    fields: [
      { key: "salaryMonth", label: "Month", required: true },
      { key: "driver", label: "Driver", required: true },
      { key: "basicSalary", label: "Basic Salary", required: true },
      { key: "roomRentDeduction", label: "Room" },
      { key: "advanceDeduction", label: "Advance" },
      { key: "trafficFineDeduction", label: "Traffic Fine" },
      { key: "visaDeduction", label: "Visa Balance" },
      { key: "otherDeduction", label: "Deduction" },
      { key: "netSalary", label: "Final Salary" },
      { key: "status", label: "Status" },
    ],
  },
  maintenance: {
    type: "MAINTENANCE",
    title: "Maintenance Excel Import",
    description: "Import old truck maintenance records.",
    path: "/import/maintenance",
    expectedColumns: ["Date", "Truck", "Maintenance Type", "Workshop", "Amount", "Notes"],
    fields: [
      { key: "maintenanceDate", label: "Date", required: true },
      { key: "truck", label: "Truck", required: true },
      { key: "maintenanceType", label: "Maintenance Type", required: true },
      { key: "workshop", label: "Workshop", required: true },
      { key: "amount", label: "Amount", required: true },
      { key: "notes", label: "Notes" },
    ],
  },
  "customer-balances": {
    type: "CUSTOMER_BALANCES",
    title: "Customer Balance Import",
    description: "Import opening balances so outstanding reports include old receivables.",
    path: "/import/customer-balances",
    expectedColumns: ["Customer", "Total Invoice", "Received", "Pending"],
    fields: [
      { key: "customer", label: "Customer", required: true },
      { key: "totalAmount", label: "Total Invoice", required: true },
      { key: "receivedAmount", label: "Received" },
      { key: "pendingAmount", label: "Pending" },
    ],
  },
};

export const importCards = Object.values(importConfigs).filter((config) => config.path !== "/import/trip-expenses");
