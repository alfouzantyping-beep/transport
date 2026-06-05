import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CustomerForm from "../../CustomerForm";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();
  return <div className="space-y-5"><h1 className="text-2xl font-black text-slate-950">Edit Customer</h1><CustomerForm customer={customer} /></div>;
}
