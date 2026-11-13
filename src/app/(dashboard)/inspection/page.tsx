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
      description="Periodic inspections of work areas and equipment."
    />
  ) : (
    <Forbidden />
  );
}
