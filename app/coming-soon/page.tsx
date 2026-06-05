import Link from "next/link";

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  const params = await searchParams;
  const moduleName = params.module || "This module";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Coming soon</p>
      <h1 className="mt-2 text-2xl font-black text-slate-950">{moduleName}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500">
        This screen is reserved for the next ERP phase. Phase 1 and Phase 2 modules are active now.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
