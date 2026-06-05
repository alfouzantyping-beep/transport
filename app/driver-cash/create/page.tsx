import { prisma } from "@/lib/db";
import CashForm from "../CashForm";

export default async function CreateCashPage() {
  const trips = await prisma.trip.findMany({ include: { driver: true }, orderBy: { tripDate: "desc" } });
  return <div className="space-y-5"><h1 className="text-2xl font-black text-slate-950">Add Driver Cash Advance</h1><CashForm trips={trips} /></div>;
}
