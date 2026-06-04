import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "GCC Transport ERP - Console",
  description: "Enterprise Logistics Management System",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check auth session
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar - fixed and desktop visible */}
      <Sidebar userRole={session.role} username={session.username} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-0 min-h-screen">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 bg-slate-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
