import { requireSession } from "@/lib/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireSession();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
