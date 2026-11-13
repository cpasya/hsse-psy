import { requirePermission } from "@/lib/guards";
import {
  Forbidden,
  ModulePlaceholder,
} from "@/components/shared/module-placeholder";
export default async function Page() {
  const { allowed } = await requirePermission("siap:view");
  return allowed ? (
    <ModulePlaceholder
      title="SIAP Card"
      description="Field behavior and condition observations."
    />
  ) : (
    <Forbidden />
  );
}
