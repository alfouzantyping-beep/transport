"use client";

import { usePathname } from "next/navigation";
import { Bell, Calendar } from "lucide-react";
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
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 text-slate-800 sticky top-0 z-30">
      {/* Search Bar / Page title */}
      <div>
        <h2 className="text-lg font-black tracking-tight text-slate-900">{getPageTitle()}</h2>
        <p className="text-xs text-slate-450 hidden sm:block font-medium">GCC logistics fleet operations and settlement console</p>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg font-semibold">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          <span>{format(new Date(), "EEEE, dd MMM yyyy")}</span>
        </div>

        {/* System Status Alert Indicator */}
        <button className="relative rounded-lg p-2 text-slate-450 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
}
