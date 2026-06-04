"use client";

import { useEffect, useState } from "react";
import { Landmark, Save, RefreshCw, Shield } from "lucide-react";

interface CompanyProfile {
  name: string;
  license: string;
  trn: string;
  address: string;
  phone: string;
  email: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<CompanyProfile>({
    name: "Gulf Logistics & Transport Co.",
    license: "GCC-EXP-908122",
    trn: "100234891200003",
    address: "Industrial Area 4, Sharjah, UAE",
    phone: "+971 6 543 2100",
    email: "info@gulflotrans.com",
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg("");

    // Simulate saving profile
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
    }, 1000);
  };

  const defaultUsers = [
    { username: "admin", email: "admin@gulflotrans.com", role: "ADMIN" },
    { username: "accountant", email: "accountant@gulflotrans.com", role: "ACCOUNTANT" },
    { username: "operations", email: "ops@gulflotrans.com", role: "OPERATIONS" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900">System Settings</h1>
        <p className="text-xs text-slate-455 font-semibold">Edit company profile details, check user roles, and customize security rules</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Company Profile Card */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <h2 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
            <Landmark className="h-5 w-5 text-emerald-600" /> Company Corporate Profile
          </h2>
          <p className="text-xs text-slate-450 font-semibold">These details will be used dynamically to render TAX Invoices and export layouts.</p>

          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold">
              Corporate profile details updated successfully.
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500">Registered Trade Name</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Commercial License Number</label>
                <input
                  type="text"
                  required
                  value={profile.license}
                  onChange={(e) => setProfile({ ...profile, license: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Tax Registration Number (TRN)</label>
                <input
                  type="text"
                  required
                  value={profile.trn}
                  onChange={(e) => setProfile({ ...profile, trn: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Official Phone</label>
                <input
                  type="text"
                  required
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Official Email</label>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500">Physical Address</label>
                <textarea
                  required
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 h-16 resize-none font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:brightness-105 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/10 font-semibold"
            >
              {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Right: Security/Users list */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 h-fit shadow-sm">
          <h2 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
            <Shield className="h-5 w-5 text-emerald-600" /> Active Users & Roles
          </h2>
          <p className="text-xs text-slate-450 font-semibold">Security groups that have access to GCC console</p>

          <div className="space-y-3">
            {defaultUsers.map((user, index) => (
              <div key={index} className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{user.username}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      user.role === "ADMIN"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : user.role === "ACCOUNTANT"
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">{user.email}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
