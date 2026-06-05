"use client";

import { useState, useEffect } from "react";
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
  UserCog,
  Tags,
  BarChart3,
  BookOpen
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

export default function Sidebar({ userRole = "Admin", username = "Admin" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    const activeSection = menuItems.find((item) =>
      item.submenu?.some(
        (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
      )
    );
    if (activeSection) {
      setExpandedSection(activeSection.title);
    } else {
      const matchesTopLevel = menuItems.some(
        (item) => item.href && (pathname === item.href || pathname.startsWith(item.href + "/"))
      );
      if (matchesTopLevel) {
        setExpandedSection(null);
      }
    }
  }, [pathname]);

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
        { title: "Customers", href: "/customers", icon: Users },
        { title: "Drivers", href: "/drivers", icon: UserCheck },
        { title: "Vehicles", href: "/vehicles", icon: Truck },
        { title: "Expense Categories", href: "/expense-categories", icon: Tags },
      ],
    },
    {
      title: "Operations",
      icon: Navigation,
      submenu: [
        { title: "Trips", href: "/trips", icon: Navigation },
        { title: "Driver Cash", href: "/driver-cash", icon: DollarSign },
        { title: "Driver Ledger", href: "/driver-ledger", icon: BookOpen },
        { title: "Trip Expenses", href: "/trip-expenses", icon: Fuel },
        { title: "Trip Settlement", href: "/trip-settlements", icon: FileText },
      ],
    },
    {
      title: "Finance",
      icon: Landmark,
      roles: ["Admin", "Accountant"],
      submenu: [
        { title: "Invoices", href: "/invoices", icon: Receipt },
        { title: "Payments", href: "/payments", icon: DollarSign },
        { title: "Customer Outstanding", href: "/customer-pending", icon: FileText },
        { title: "Driver Salary", href: "/salaries", icon: UserCog },
      ],
    },
    {
      title: "Fleet Management",
      icon: Wrench,
      submenu: [
        { title: "Maintenance", href: "/maintenance", icon: Wrench },
        { title: "Vehicle Expenses", href: "/vehicle-expenses", icon: Fuel },
        { title: "Truck Profit", href: "/truck-profit", icon: BarChart3 },
      ],
    },
    {
      title: "Data Import",
      icon: FileSpreadsheet,
      submenu: [
        { title: "Excel Import", href: "/import", icon: FileSpreadsheet },
        { title: "Import Logs", href: "/import/logs", icon: FileText },
      ],
    },
    {
      title: "Reports",
      icon: FileText,
      roles: ["Admin", "Accountant"],
      submenu: [
        { title: "Trip Profit", href: "/coming-soon?module=Trip%20Profit", icon: BarChart3 },
        { title: "Driver Cash", href: "/dashboard/driver-cash", icon: DollarSign },
        { title: "Driver Salary", href: "/salaries", icon: UserCog },
        { title: "Truck Profit", href: "/truck-profit", icon: Truck },
        { title: "Customer Outstanding", href: "/customer-pending", icon: Users },
        { title: "Monthly P&L", href: "/coming-soon?module=Monthly%20P%26L", icon: BarChart3 },
      ],
    },
    {
      title: "Settings",
      icon: Settings,
      roles: ["Admin"],
      submenu: [
        { title: "Company", href: "/settings/company", icon: Landmark },
        { title: "Users", href: "/coming-soon?module=Users", icon: Users },
        { title: "Roles", href: "/coming-soon?module=Roles", icon: UserCog },
      ],
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
      <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 text-slate-800 md:hidden shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">GCC Transport ERP</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col justify-between border-r border-slate-200/80 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] px-4 py-5 shadow-[8px_0_24px_-12px_rgba(0,0,0,0.08)] transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:relative animate-none"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col space-y-6">
          {/* Logo Area */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white px-3 py-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_4px_15px_rgba(16,185,129,0.25),inset_0_2px_2px_rgba(255,255,255,0.2)]">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-black leading-tight text-slate-800 tracking-wide">GCC LOGISTICS</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 drop-shadow-[0_0_4px_rgba(16,185,129,0.1)]">
                Transport ERP
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {visibleMenuItems.map((item, idx) => {
              const isSubmenuExpanded = expandedSection === item.title;
              const hasSubmenu = !!item.submenu;
              const isItemActive = item.href ? pathname === item.href : item.submenu?.some((sub) => pathname === sub.href);

              return (
                <div key={idx} className="space-y-1">
                  {hasSubmenu ? (
                    <button
                      onClick={() => toggleSection(item.title)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-300 hover:translate-x-0.5 ${
                        isSubmenuExpanded
                          ? "bg-white text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-slate-200/80"
                          : "text-slate-600 hover:bg-white/50 hover:text-slate-800 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition duration-300 ${
                            isSubmenuExpanded
                              ? "bg-gradient-to-br from-emerald-50 to-teal-50/50 text-emerald-600 border border-emerald-100 shadow-sm"
                              : "bg-white text-slate-400 border border-slate-200/60 shadow-sm"
                          }`}
                        >
                          <item.icon className="h-4.5 w-4.5" />
                        </div>
                        <span className="tracking-wide">{item.title}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ${
                          isSubmenuExpanded ? "rotate-180 text-emerald-600" : "text-slate-400"
                        }`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-300 hover:translate-x-1 ${
                        isItemActive
                          ? "bg-gradient-to-r from-emerald-50/70 to-white/10 text-emerald-800 border-l-2 border-emerald-500 shadow-[inset_1px_0_0_rgba(255,255,255,0.4),0_4px_12px_rgba(16,185,129,0.05)]"
                          : "text-slate-600 hover:bg-white/50 hover:text-slate-800"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition duration-300 ${
                          isItemActive
                            ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/5 text-emerald-600"
                            : "bg-white text-slate-400 border border-slate-200/60 shadow-sm"
                        }`}
                      >
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="tracking-wide">{item.title}</span>
                    </Link>
                  )}

                  {/* Submenu render */}
                  {hasSubmenu && isSubmenuExpanded && (
                    <div className="ml-4.5 mt-1.5 space-y-1 border-l border-slate-200/80 pl-3">
                      {item.submenu?.map((sub, subIdx) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={subIdx}
                            href={sub.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-300 hover:translate-x-1 ${
                              isSubActive
                                ? "bg-gradient-to-r from-emerald-50/40 to-white/10 text-emerald-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-800 hover:bg-white/30 hover:shadow-sm"
                            }`}
                          >
                            <sub.icon
                              className={`h-4 w-4 transition duration-300 ${
                                isSubActive ? "text-emerald-600 drop-shadow-[0_0_4px_rgba(16,185,129,0.2)]" : "text-slate-400"
                              }`}
                            />
                            <span className="tracking-wide">{sub.title}</span>
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

        {/* Footer User Profile */}
        <div className="mt-4 border-t border-slate-200/80 pt-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-800 tracking-wide">{username}</p>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                {userRole}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="cursor-pointer rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600 shadow-sm"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-sm md:hidden"
        ></div>
      )}
    </>
  );
}
