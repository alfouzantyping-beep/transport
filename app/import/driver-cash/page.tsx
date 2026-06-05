import ImportPageShell from "@/components/import/ImportPageShell";
import { importConfigs } from "@/lib/import-config";

export default function DriverCashImportPage() {
  return <ImportPageShell config={importConfigs["driver-cash"]} />;
}
