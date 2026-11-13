import { requirePermission } from "@/lib/guards";
import {
  Forbidden,
  ModulePlaceholder,
} from "@/components/shared/module-placeholder";
export default async function Page() {
  const { allowed } = await requirePermission("audit:view");
  return allowed ? (
    <ModulePlaceholder
      title="HSSE Audit"
      description="Safety audits and findings follow-up."
    />
  ) : (
    <Forbidden />
  );
}
