import { Forbidden } from "@/components/shared/module-placeholder";
import { DepartmentsPage } from "@/features/departments/components/departments-page";
import { requirePermission } from "@/lib/guards";

export const metadata = {
  title: "Departments",
};

export default async function Page() {
  const { allowed } = await requirePermission("departments.read");

  return allowed ? <DepartmentsPage /> : <Forbidden />;
}
