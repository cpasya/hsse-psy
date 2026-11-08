import { Forbidden } from "@/components/shared/module-placeholder";
import { JobPositionsPage } from "@/features/job-positions/components/job-positions-page";
import { requirePermission } from "@/lib/guards";

export const metadata = { title: "Job Positions" };

export default async function Page() {
  const { allowed } = await requirePermission("job-positions.read");
  return allowed ? <JobPositionsPage /> : <Forbidden />;
}
