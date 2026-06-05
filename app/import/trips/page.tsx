import ImportPageShell from "@/components/import/ImportPageShell";
import { importConfigs } from "@/lib/import-config";

export default function TripImportPage() {
  return <ImportPageShell config={importConfigs.trips} />;
}
