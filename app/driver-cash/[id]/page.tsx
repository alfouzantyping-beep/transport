import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

function money(v: number) { return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(v); }

export default async function CashDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cash = await prisma.driverCashAdvance.findUnique({ where: { id }, include: { trip: true, driver: true } });
  if (!cash) notFound();
  return <div className="space-y-5"><h1 className="text-2xl font-black text-slate-950">Cash Advance</h1><div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">{[["Trip", cash.trip.tripNo || cash.trip.tripNumber],["Driver", cash.driver.name],["Amount", money(Number(cash.amount))],["Date", cash.cashDate.toLocaleDateString()],["Method", cash.paymentMethod],["Given By", cash.givenBy],["Notes", cash.notes || "-"]].map(([l,v]) => <div key={l}><p className="text-xs font-bold uppercase text-slate-500">{l}</p><p className="mt-1 font-semibold text-slate-900">{v}</p></div>)}</div></div>;
}
