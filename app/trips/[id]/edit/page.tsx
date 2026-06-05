import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import TripForm from "../../TripForm";

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trip, customers, drivers, vehicles] = await Promise.all([
    prisma.trip.findUnique({ where: { id } }),
    prisma.customer.findMany({ orderBy: { companyName: "asc" } }),
    prisma.driver.findMany({ orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ orderBy: { truckNo: "asc" } }),
  ]);
  if (!trip) notFound();
  return <div className="space-y-5"><h1 className="text-2xl font-black text-slate-950">Edit Trip</h1><TripForm trip={trip} customers={customers} drivers={drivers} vehicles={vehicles} /></div>;
}
