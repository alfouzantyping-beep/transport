"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, User, Lock, Loader2, Landmark } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your database connection.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: string) => {
    if (role === "admin") {
      setUsername("admin");
      setPassword("admin123");
    } else if (role === "accountant") {
      setUsername("accountant");
      setPassword("accountant123");
    } else if (role === "operations") {
      setUsername("operations");
      setPassword("operations123");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Light Mode Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 bg-white/90 backdrop-blur-xl border border-slate-200/80 p-8 rounded-2xl shadow-xl shadow-slate-100">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-600/10 mb-4 text-white">
            <Landmark className="h-8 w-8" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-slate-900">
            GCC Transport ERP
          </h2>
          <p className="mt-1 text-center text-sm text-slate-500 font-medium">
            Enter your credentials to access the console
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Username
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-xl border border-slate-250 bg-white py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 sm:text-sm font-medium"
                  placeholder="admin, accountant..."
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-250 bg-white py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 sm:text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 px-4 text-sm font-bold text-white hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-all shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Sign In
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Demo Roles Helper */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Quick Fill Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fillCredentials("admin")}
              className="rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2 py-1.5 text-xs font-bold text-emerald-600 transition cursor-pointer"
            >
              Admin
            </button>
            <button
              onClick={() => fillCredentials("accountant")}
              className="rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2 py-1.5 text-xs font-bold text-blue-600 transition cursor-pointer"
            >
              Accountant
            </button>
            <button
              onClick={() => fillCredentials("operations")}
              className="rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2 py-1.5 text-xs font-bold text-amber-600 transition cursor-pointer"
            >
              Operations
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-3 font-semibold">
            * Note: Database must be seeded for these credentials to work.
          </p>
        </div>
      </div>
    </div>
  );
}
