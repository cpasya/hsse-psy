import { requirePermission } from "@/lib/guards";
import {
  Forbidden,
  ModulePlaceholder,
} from "@/components/shared/module-placeholder";
export default async function Page() {
  const { allowed } = await requirePermission("action:view");
  return allowed ? (
    <ModulePlaceholder
      title="Action Tracking"
      description="Centralized follow-up for findings and CAPA."
    />
  ) : (
    <Forbidden />
  );
}
