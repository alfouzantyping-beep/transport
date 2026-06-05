"use client";

import { usePathname } from "next/navigation";
import { Bell, Calendar, Search } from "lucide-react";
import { format } from "date-fns";

export default function Navbar() {
  const pathname = usePathname();

  // Helper to format pathname into a page title
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard Overview";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      const last = segments[segments.length - 1];
      return last.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return "GCC Transport ERP";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white/70 px-5 text-slate-800 backdrop-blur-md lg:px-7 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.04)]">
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">{getPageTitle()}</h2>
        <p className="hidden text-[10px] font-extrabold uppercase tracking-wide text-slate-400 sm:block">
          GCC fleet, finance, and settlement control
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden w-72 items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50/50 hover:bg-slate-50 px-3.5 py-2 text-xs text-slate-500 xl:flex transition shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="font-bold">Search trips, customers, vehicles...</span>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm lg:flex">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          <span>{format(new Date(), "EEEE, dd MMM yyyy")}</span>
        </div>

        <button className="relative cursor-pointer rounded-xl border border-slate-200/60 bg-white p-2.5 text-slate-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-950 hover:shadow-md">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"></span>
        </button>
      </div>
    </header>
  );
}
