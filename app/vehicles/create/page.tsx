import { prisma } from "@/lib/db";
import VehicleForm from "../VehicleForm";

export default async function CreateVehiclePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const drivers = await prisma.driver.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-950">Add Vehicle</h1>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      <VehicleForm drivers={drivers} />
    </div>
  );
}
