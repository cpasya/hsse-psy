import { requirePermission } from "@/lib/guards";
import {
  Forbidden,
  ModulePlaceholder,
} from "@/components/shared/module-placeholder";
export default async function Page() {
  const { allowed } = await requirePermission("risk:view");
  return allowed ? (
    <ModulePlaceholder
      title="Risk Management"
      description="Register HIRADC dan pengendalian risiko."
    />
  ) : (
    <Forbidden />
  );
}
