"use client";

import { useEffect, useState, use } from "react";
import { format } from "date-fns";
import { RefreshCw, Printer } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  trn: string;
  address: string;
  phone: string;
  email: string;
}

interface Trip {
  id: string;
  tripNumber: string;
  tripDate: string;
  fromCountry: string;
  toCountry: string;
  loadingPoint: string;
  deliveryPoint: string;
  doNumber: string;
  cargoType: string;
  cargoWeight: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  notes: string;
  customer: Customer;
  trip: Trip;
}

export default function PrintInvoicePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  useEffect(() => {
    if (invoice) {
      // Trigger print after rendering completes
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [invoice]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED"
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-800" />
        <span className="text-xs font-bold text-slate-500">Preparing Print Document...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center text-xs font-bold text-rose-600">
        Error: Invoice not found. Close this tab and try again.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black font-sans leading-relaxed text-xs">
      {/* Print Button (hidden during print) */}
      <div className="flex justify-end mb-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
        >
          <Printer className="h-4 w-4" /> Print Document
        </button>
      </div>

      {/* Invoice Header */}
      <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">GULF LOGISTICS & TRANSPORT CO.</h1>
          <p className="text-slate-500 font-semibold mt-1">
            Industrial Area 4, Sharjah, United Arab Emirates<br />
            Phone: +971 6 543 2100 | Email: info@gulflotrans.com<br />
            TRN (Tax Registration Number): 100234891200003
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-black text-emerald-800 uppercase tracking-wider">Tax Invoice</h2>
          <span className="block text-sm font-black text-slate-900 mt-2">{invoice.invoiceNumber}</span>
          <p className="text-slate-500 mt-1">
            Date: {format(new Date(invoice.invoiceDate), "dd/MM/yyyy")}<br />
            Due Date: {format(new Date(invoice.dueDate), "dd/MM/yyyy")}
          </p>
        </div>
      </div>

      {/* Bill To Grid */}
      <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200">
        <div>
          <h3 className="font-black text-slate-900 uppercase tracking-wider mb-2">Billed To (Customer):</h3>
          <p className="text-slate-700 font-bold text-sm">{invoice.customer.name}</p>
          <p className="text-slate-500 mt-1 leading-relaxed">
            {invoice.customer.address}<br />
            TRN: {invoice.customer.trn || "N/A"}<br />
            Email: {invoice.customer.email} | Phone: {invoice.customer.phone}
          </p>
        </div>
        <div>
          <h3 className="font-black text-slate-900 uppercase tracking-wider mb-2">Trip Specifications:</h3>
          <p className="text-slate-700 font-semibold">Trip Reference: <span className="font-mono text-sm font-black">{invoice.trip.tripNumber}</span></p>
          <p className="text-slate-500 mt-1">
            Route: {invoice.trip.loadingPoint} ({invoice.trip.fromCountry}) to {invoice.trip.deliveryPoint} ({invoice.trip.toCountry})<br />
            Cargo Type: {invoice.trip.cargoType} ({invoice.trip.cargoWeight} Tons)<br />
            Delivery Order (DO) #: {invoice.trip.doNumber || "N/A"}
          </p>
        </div>
      </div>

      {/* Line Item Table */}
      <div className="py-6">
        <table className="w-full text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-black uppercase">
              <th className="py-3 px-4 border-r border-slate-300">Item Description</th>
              <th className="py-3 px-4 border-r border-slate-300 text-right">Qty / Weight</th>
              <th className="py-3 px-4 border-r border-slate-300 text-right">Unit Price</th>
              <th className="py-3 px-4 text-right">Net Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 font-semibold text-slate-750">
            <tr>
              <td className="py-4 px-4 border-r border-slate-300">
                <span className="block font-bold text-slate-950">Land Freight Charges</span>
                <span className="block text-[10px] text-slate-500 mt-1">
                  Transportation & logistics services from {invoice.trip.loadingPoint} to {invoice.trip.deliveryPoint} via {invoice.trip.cargoType}
                </span>
              </td>
              <td className="py-4 px-4 border-r border-slate-300 text-right">{invoice.trip.cargoWeight} Tons</td>
              <td className="py-4 px-4 border-r border-slate-300 text-right">
                {formatCurrency(invoice.subtotal / (invoice.trip.cargoWeight || 1))} / Ton
              </td>
              <td className="py-4 px-4 text-right text-slate-950 font-black">{formatCurrency(invoice.subtotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="grid grid-cols-2 gap-8 py-6 border-t border-slate-200">
        <div>
          <h4 className="font-black text-slate-900 uppercase tracking-wider mb-2">Payment Bank Instructions:</h4>
          <p className="text-slate-500 leading-relaxed font-medium">
            Please make bank wire payments to:<br />
            <span className="font-bold text-slate-900">Bank Name:</span> Emirates NBD<br />
            <span className="font-bold text-slate-900">Account No:</span> 1234567890<br />
            <span className="font-bold text-slate-900">IBAN:</span> AE070331234567890123456<br />
            <span className="font-bold text-slate-900">Beneficiary:</span> Gulf Logistics & Transport Co.
          </p>
        </div>

        <div className="space-y-2 text-right text-slate-700 font-semibold">
          <div className="flex justify-between pl-12">
            <span>Subtotal Freight:</span>
            <span className="text-slate-950">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between pl-12">
            <span>VAT ({invoice.vatRate}%):</span>
            <span className="text-slate-950">{formatCurrency(invoice.vatAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-slate-950 border-t border-slate-300 pt-2 pl-12">
            <span>Total Payable (AED):</span>
            <span className="text-emerald-800">{formatCurrency(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 pl-12">
            <span>Total Received:</span>
            <span>{formatCurrency(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-rose-700 bg-slate-50 p-2 rounded border border-slate-200 pl-12">
            <span>Outstanding Balance:</span>
            <span>{formatCurrency(invoice.pendingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Notes / Terms */}
      {invoice.notes && (
        <div className="bg-slate-50 p-4 border border-slate-200 rounded mb-8">
          <span className="block font-black text-slate-900 uppercase tracking-wider mb-1">Remarks & Terms:</span>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}

      {/* Signature & Seal Footer */}
      <div className="mt-16 pt-8 border-t border-slate-250 grid grid-cols-2 gap-8 text-center text-slate-500 font-bold">
        <div>
          <div className="h-16"></div>
          <span className="block border-t border-slate-300 pt-2 w-48 mx-auto">Customer Signature</span>
        </div>
        <div>
          <div className="h-16"></div>
          <span className="block border-t border-slate-300 pt-2 w-48 mx-auto">Authorized Signatory</span>
        </div>
      </div>
    </div>
  );
}
