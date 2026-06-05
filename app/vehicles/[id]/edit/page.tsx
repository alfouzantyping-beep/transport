import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import VehicleForm from "../../VehicleForm";

export default async function EditVehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const [vehicle, drivers] = await Promise.all([prisma.vehicle.findUnique({ where: { id } }), prisma.driver.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } })]);
  if (!vehicle) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-950">Edit Vehicle</h1>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      <VehicleForm vehicle={vehicle} drivers={drivers} />
    </div>
  );
}
