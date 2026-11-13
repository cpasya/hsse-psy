import { requirePermission } from "@/lib/guards";
import { Forbidden } from "@/components/shared/module-placeholder";
import { IntegrationPending } from "@/components/shared/integration-pending";
export const metadata = { title: "Incident Report" };
export default async function Page() {
  const { allowed } = await requirePermission("incident:create");
  return allowed ? (
    <IntegrationPending
      title="Incident Report"
      description="The report form will be available after storage and validation APIs are integrated."
    />
  ) : (
    <Forbidden />
  );
}
