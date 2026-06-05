import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import ExcelImportClient from "@/components/import/ExcelImportClient";
import type { ImportConfig } from "@/lib/import-config";

export default function ImportPageShell({ config }: { config: ImportConfig }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">{config.title}</h1>
          <p className="text-sm text-slate-500">{config.description}</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white" href="/import/logs">
          <FileSpreadsheet className="h-4 w-4" />
          Import Logs
        </Link>
      </div>
      <ExcelImportClient config={config} />
    </div>
  );
}
