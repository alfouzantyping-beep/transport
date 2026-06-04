"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Truck,
  Database,
  Navigation,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  FileText,
  Settings,
  Menu,
  ChevronDown,
  LogOut,
  Landmark,
  UserCheck,
  Fuel,
  Wrench,
  UserCog
} from "lucide-react";

interface MenuItem {
  title: string;
  href?: string;
  icon?: any;
  roles?: string[];
  submenu?: { title: string; href: string; icon: any }[];
}

interface SidebarProps {
  userRole?: string;
  username?: string;
}

export default function Sidebar({ userRole = "ADMIN", username = "Admin" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("Operations");

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Master Data",
      icon: Database,
      submenu: [
        { title: "Customers", href: "/dashboard/customers", icon: Users },
        { title: "Drivers", href: "/dashboard/drivers", icon: UserCheck },
        { title: "Trucks", href: "/dashboard/trucks", icon: Truck },
      ],
    },
    {
      title: "Operations",
      icon: Navigation,
      submenu: [
        { title: "Trips Log", href: "/dashboard/trips", icon: Navigation },
        { title: "Driver Cash", href: "/dashboard/driver-cash", icon: DollarSign },
        { title: "Trip Expenses", href: "/dashboard/trip-expenses", icon: Fuel },
        { title: "Trip Closing", href: "/dashboard/trip-closing", icon: FileText },
        { title: "Driver Ledger", href: "/dashboard/driver-ledger", icon: FileSpreadsheet },
      ],
    },
    {
      title: "Finance",
      icon: Landmark,
      roles: ["ADMIN", "ACCOUNTANT"],
      submenu: [
        { title: "Invoices", href: "/dashboard/invoices", icon: Receipt },
        { title: "Payments", href: "/dashboard/payments", icon: DollarSign },
        { title: "Driver Salary", href: "/dashboard/salaries", icon: UserCog },
      ],
    },
    {
      title: "Truck Management",
      icon: Wrench,
      submenu: [
        { title: "Truck Maintenance", href: "/dashboard/truck-maintenance", icon: Wrench },
      ],
    },
    {
      title: "Data Import",
      href: "/dashboard/import",
      icon: FileSpreadsheet,
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: FileText,
      roles: ["ADMIN", "ACCOUNTANT"],
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      roles: ["ADMIN"],
    },
  ];

  const filterMenuByRole = (items: MenuItem[]) => {
    return items.filter((item) => {
      if (item.roles && !item.roles.includes(userRole)) {
        return false;
      }
      return true;
    });
  };

  const visibleMenuItems = filterMenuByRole(menuItems);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden text-slate-800">
        <div className="flex items-center gap-2">
          <Landmark className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-lg">GCC Transport ERP</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-300 md:translate-x-0 flex flex-col justify-between ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:relative animate-none"
        }`}
      >
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-md font-bold text-slate-900 leading-tight">GCC LOGISTICS</h1>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-600">
                Transport ERP
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-slate-200">
            {visibleMenuItems.map((item, idx) => {
              const isSubmenuExpanded = expandedSection === item.title;
              const hasSubmenu = !!item.submenu;
              const isItemActive = item.href ? pathname === item.href : false;

              return (
                <div key={idx} className="space-y-1">
                  {hasSubmenu ? (
                    <button
                      onClick={() => toggleSection(item.title)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition cursor-pointer ${
                        isSubmenuExpanded
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${isSubmenuExpanded ? "text-emerald-600" : "text-slate-450"}`} />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isSubmenuExpanded ? "rotate-180 text-emerald-600" : "text-slate-450"
                        }`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        isItemActive
                          ? "bg-emerald-50 text-emerald-600 border-l-2 border-emerald-600 pl-2.5"
                          : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${isItemActive ? "text-emerald-600" : "text-slate-450"}`} />
                      <span>{item.title}</span>
                    </Link>
                  )}

                  {/* Submenu render */}
                  {hasSubmenu && isSubmenuExpanded && (
                    <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-1">
                      {item.submenu?.map((sub, subIdx) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={subIdx}
                            href={sub.href}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              isSubActive
                                ? "bg-slate-100 text-emerald-600"
                                : "text-slate-550 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <sub.icon className="h-4 w-4 text-slate-400" />
                            <span>{sub.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-150 pt-4 mt-auto">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-150">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{username}</p>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                {userRole}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-red-600 transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
        ></div>
      )}
    </>
  );
}
