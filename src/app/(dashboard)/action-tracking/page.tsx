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
      description="Pusat tindak lanjut temuan dan CAPA."
    />
  ) : (
    <Forbidden />
  );
}
