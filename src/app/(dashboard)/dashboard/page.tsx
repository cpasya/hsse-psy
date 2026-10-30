import { requireSession } from "@/lib/guards";

import { Dashboard } from "@/features/dashboard/components/dashboard";

export const metadata = {
  title: "Dashboard HSSE",
};

export default async function Page() {
  await requireSession();

  return <Dashboard />;
}
