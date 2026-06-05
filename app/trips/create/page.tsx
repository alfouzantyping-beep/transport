import { prisma } from "@/lib/db";
import TripForm from "../TripForm";

export default async function CreateTripPage() {
  const [customers, drivers, vehicles] = await Promise.all([
    prisma.customer.findMany({ where: { status: "ACTIVE" }, orderBy: { companyName: "asc" } }),
    prisma.driver.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ orderBy: { truckNo: "asc" } }),
  ]);
  return <div className="space-y-5"><h1 className="text-2xl font-black text-slate-950">Create Trip</h1><TripForm customers={customers} drivers={drivers} vehicles={vehicles} /></div>;
}
