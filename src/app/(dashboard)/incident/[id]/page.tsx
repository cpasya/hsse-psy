import { requirePermission } from "@/lib/guards";
import { Forbidden } from "@/components/shared/module-placeholder";
import { IntegrationPending } from "@/components/shared/integration-pending";
export const metadata = { title: "Detail Insiden" };
export default async function Page() {
  const { allowed } = await requirePermission("incident:view");
  return allowed ? (
    <IntegrationPending
      title="Detail Insiden"
      description="Detail laporan akan dimuat dari backend setelah kontrak API tersedia."
    />
  ) : (
    <Forbidden />
  );
}
