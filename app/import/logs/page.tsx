import { prisma } from "@/lib/db";

function formatDate(value: Date) {
  return value.toLocaleString("en-AE");
}

export default async function ImportLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const selectedLogId = Array.isArray(sp.logId) ? sp.logId[0] : sp.logId;
  const logs = await prisma.importLog.findMany({
    include: { uploadedBy: true, rowErrors: { orderBy: { rowNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const selected = selectedLogId ? logs.find((log) => log.id === selectedLogId) : logs[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Import Logs</h1>
        <p className="text-sm text-slate-500">Audit trail for Excel uploads, validation errors, and imported rows.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Import Type</th>
              <th className="p-3">File Name</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Success</th>
              <th className="p-3 text-right">Failed</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Uploaded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className={log.id === selected?.id ? "bg-emerald-50/40" : "hover:bg-slate-50"}>
                <td className="p-3 font-bold">{log.importType.replaceAll("_", " ")}</td>
                <td className="p-3">{log.fileName}</td>
                <td className="p-3 text-right font-semibold">{log.totalRows}</td>
                <td className="p-3 text-right font-black text-emerald-700">{log.successRows}</td>
                <td className="p-3 text-right font-black text-rose-700">{log.failedRows}</td>
                <td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">{log.status}</span></td>
                <td className="p-3">{formatDate(log.createdAt)}</td>
                <td className="p-3">{log.uploadedBy?.name || "-"}</td>
              </tr>
            ))}
            {!logs.length && (
              <tr><td className="p-6 text-center text-slate-500" colSpan={8}>No import logs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-black text-slate-900">Failed Rows</h2>
            <p className="text-xs text-slate-500">{selected.fileName} validation errors.</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Row</th>
                <th className="p-3">Error Message</th>
                <th className="p-3">Raw Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selected.rowErrors.map((error) => (
                <tr key={error.id} className="hover:bg-slate-50">
                  <td className="p-3 font-black text-rose-700">{error.rowNumber}</td>
                  <td className="p-3 font-semibold text-rose-700">{error.errorMessage}</td>
                  <td className="max-w-xl truncate p-3 font-mono text-xs text-slate-500">{error.rawData}</td>
                </tr>
              ))}
              {!selected.rowErrors.length && (
                <tr><td className="p-6 text-center text-slate-500" colSpan={3}>No failed rows for this import.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
