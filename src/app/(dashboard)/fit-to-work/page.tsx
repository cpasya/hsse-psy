import { requirePermission } from "@/lib/guards";
import {
  Forbidden,
  ModulePlaceholder,
} from "@/components/shared/module-placeholder";
export default async function Page() {
  const { allowed } = await requirePermission("ftw:submit_own");
  return allowed ? (
    <ModulePlaceholder
      title="Fit to Work"
      description="Daily work readiness — medical data requires a dedicated access policy."
    />
  ) : (
    <Forbidden />
  );
}
