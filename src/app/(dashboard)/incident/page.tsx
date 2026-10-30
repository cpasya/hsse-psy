import { requirePermission } from "@/lib/guards";
import { Forbidden } from "@/components/shared/module-placeholder";
import { IntegrationPending } from "@/components/shared/integration-pending";
export const metadata = { title: "Incident Management" };
export default async function Page() {
  const { allowed } = await requirePermission("incident:view");
  return allowed ? (
    <IntegrationPending
      title="Incident Management"
      description="Wadah daftar laporan insiden dari backend."
    />
  ) : (
    <Forbidden />
  );
}
