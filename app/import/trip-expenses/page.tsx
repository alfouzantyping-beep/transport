import ImportPageShell from "@/components/import/ImportPageShell";
import { importConfigs } from "@/lib/import-config";

export default function TripExpensesImportPage() {
  return <ImportPageShell config={importConfigs["trip-expenses"]} />;
}
