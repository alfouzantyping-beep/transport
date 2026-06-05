import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import DriverForm from "../../DriverForm";

export default async function EditDriverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) notFound();
  return <div className="space-y-5"><h1 className="text-2xl font-black text-slate-950">Edit Driver</h1><DriverForm driver={driver} /></div>;
}
