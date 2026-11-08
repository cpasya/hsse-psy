import { Forbidden } from "@/components/shared/module-placeholder";
import { CompaniesPage } from "@/features/companies/components/companies-page";
import { requirePermission } from "@/lib/guards";

export const metadata = { title: "Companies" };

export default async function Page() {
  const { allowed } = await requirePermission("companies.read");
  return allowed ? <CompaniesPage /> : <Forbidden />;
}
