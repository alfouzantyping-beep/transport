import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { importCards, importConfigs } from "@/lib/import-config";

export default function ImportHomePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Excel Import</h1>
        <p className="text-sm text-slate-500">Safe import workflow for old Excel records with preview, mapping, validation, and logs.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {importCards.map((config) => (
          <Link key={config.path} href={config.path} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow-md">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            <h2 className="mt-4 text-lg font-black text-slate-900">{config.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{config.description}</p>
          </Link>
        ))}
        <Link href="/import/trip-expenses" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow-md">
          <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
          <h2 className="mt-4 text-lg font-black text-slate-900">{importConfigs["trip-expenses"].title}</h2>
          <p className="mt-1 text-sm text-slate-500">{importConfigs["trip-expenses"].description}</p>
        </Link>
      </div>
    </div>
  );
}
