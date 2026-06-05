import ImportPageShell from "@/components/import/ImportPageShell";
import { importConfigs } from "@/lib/import-config";

export default function SalaryImportPage() {
  return <ImportPageShell config={importConfigs.salaries} />;
}
