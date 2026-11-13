import { requirePermission } from "@/lib/guards";
import { Forbidden } from "@/components/shared/module-placeholder";
import { IntegrationPending } from "@/components/shared/integration-pending";
export const metadata = { title: "Incident Details" };
export default async function Page() {
  const { allowed } = await requirePermission("incident:view");
  return allowed ? (
    <IntegrationPending
      title="Incident Details"
      description="Report details will be loaded from the backend after the API contract is available."
    />
  ) : (
    <Forbidden />
  );
}
