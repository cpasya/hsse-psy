import { requirePermission } from "@/lib/guards";
import { Forbidden } from "@/components/shared/module-placeholder";
import { IntegrationPending } from "@/components/shared/integration-pending";
export const metadata = { title: "Laporan Insiden" };
export default async function Page() {
  const { allowed } = await requirePermission("incident:create");
  return allowed ? (
    <IntegrationPending
      title="Laporan Insiden"
      description="Form laporan akan tersedia setelah API penyimpanan dan validasi terintegrasi."
    />
  ) : (
    <Forbidden />
  );
}
