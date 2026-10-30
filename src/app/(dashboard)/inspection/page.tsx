import { requirePermission } from "@/lib/guards";
import {
  Forbidden,
  ModulePlaceholder,
} from "@/components/shared/module-placeholder";
export default async function Page() {
  const { allowed } = await requirePermission("inspection:view");
  return allowed ? (
    <ModulePlaceholder
      title="HSSE Inspection"
      description="Inspeksi berkala area kerja dan peralatan."
    />
  ) : (
    <Forbidden />
  );
}
