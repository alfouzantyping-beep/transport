import ImportPageShell from "@/components/import/ImportPageShell";
import { importConfigs } from "@/lib/import-config";

export default function MaintenanceImportPage() {
  return <ImportPageShell config={importConfigs.maintenance} />;
}
