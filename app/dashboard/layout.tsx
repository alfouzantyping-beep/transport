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
    <div className="flex min-h-screen bg-[#f3f6f8] text-slate-900 font-sans">
      {/* Sidebar - fixed and desktop visible */}
      <Sidebar userRole={session.role} username={session.name} />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-[#f3f6f8] p-4 sm:p-6 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
