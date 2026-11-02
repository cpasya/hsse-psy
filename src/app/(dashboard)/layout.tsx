import { requireSession } from "@/lib/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SessionProvider } from "@/providers/session-provider";
import { redirect } from "next/navigation";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  if (session.user.mustachePassword) {
    redirect("/change-password");
  }

  return (
    <SessionProvider session={session}>
      <DashboardShell user={session.user}>{children}</DashboardShell>
    </SessionProvider>
  );
}
