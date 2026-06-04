"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, AlertCircle, Edit } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  trn: string;
  paymentTerms: string;
  phone: string;
  email: string;
  address: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveDb, setLiveDb] = useState(true);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formName, setFormName] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formTrn, setFormTrn] = useState("");
  const [formTerms, setFormTerms] = useState("Net 30");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data.data);
      setLiveDb(data.live);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormContact(customer.contactPerson);
    setFormTrn(customer.trn);
    setFormTerms(customer.paymentTerms);
    setFormPhone(customer.phone);
    setFormEmail(customer.email);
    setFormAddress(customer.address || "");
    setFormError("");
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName("");
    setFormContact("");
    setFormTrn("");
    setFormTerms("Net 30");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormError("");
    setShowModal(true);
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formName || !formContact || !formTrn || !formEmail) {
      setFormError("Company Name, Contact Person, TRN, and Email are required.");
      setSubmitting(false);
      return;
    }

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          contactPerson: formContact,
          trn: formTrn,
          paymentTerms: formTerms,
          phone: formPhone,
          email: formEmail,
          address: formAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save customer");

      if (editingCustomer) {
        setCustomers(customers.map(c => c.id === editingCustomer.id ? data.data : c));
      } else {
        setCustomers([data.data, ...customers]);
      }
      
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.trn.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Registered Customers</h1>
          <p className="text-xs text-slate-450 font-semibold">Corporate accounts and billing profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-105 shadow-md shadow-emerald-600/10 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Database Warning */}
      {!liveDb && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Running in SQLite Database Mode. Custom customers will be saved to your local `dev.db` file.</span>
        </div>
      )}

      {/* Filters & search */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name, contact, TRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:border-emerald-600 font-medium"
          />
        </div>
        <button
          onClick={fetchCustomers}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-455 bg-slate-50/50">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Tax Registration (TRN)</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4">Phone / Email</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-450 font-bold">
                      No customer records found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-900 font-black">{c.name}</td>
                      <td className="py-3 px-4 text-slate-700">{c.contactPerson}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{c.trn}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {c.paymentTerms}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-650">
                        <div>{c.phone}</div>
                        <div className="text-[10px] text-slate-400">{c.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{c.address}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="rounded-lg p-1 text-slate-450 hover:bg-slate-100 hover:text-emerald-600 transition cursor-pointer"
                          title="Edit Customer Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900 mb-4">
              {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : "Register New Customer"}
            </h2>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-655 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="e.g. Almarai Company"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">TRN Number *</label>
                  <input
                    type="text"
                    required
                    value={formTrn}
                    onChange={(e) => setFormTrn(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="15-digit TRN"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Payment Terms</label>
                  <select
                    value={formTerms}
                    onChange={(e) => setFormTerms(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="COD">COD</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="+971..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                    placeholder="billing@company.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500">Office Address</label>
                  <textarea
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium h-16 resize-none"
                    placeholder="Plot #, Area, City"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 font-semibold">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:brightness-105 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingCustomer ? "Save Changes" : "Register Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
