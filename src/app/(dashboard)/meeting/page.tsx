import { requirePermission } from "@/lib/guards";
import {
  Forbidden,
  ModulePlaceholder,
} from "@/components/shared/module-placeholder";
export default async function Page() {
  const { allowed } = await requirePermission("meeting:view");
  return allowed ? (
    <ModulePlaceholder
      title="HSSE Meeting"
      description="Jadwal, kehadiran, dan notulen rapat keselamatan."
    />
  ) : (
    <Forbidden />
  );
}
