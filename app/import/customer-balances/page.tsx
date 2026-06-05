import ImportPageShell from "@/components/import/ImportPageShell";
import { importConfigs } from "@/lib/import-config";

export default function CustomerBalancesImportPage() {
  return <ImportPageShell config={importConfigs["customer-balances"]} />;
}
