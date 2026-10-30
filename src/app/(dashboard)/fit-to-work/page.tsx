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
      description="Kesiapan kerja harian — data medis memerlukan kebijakan akses khusus."
    />
  ) : (
    <Forbidden />
  );
}
