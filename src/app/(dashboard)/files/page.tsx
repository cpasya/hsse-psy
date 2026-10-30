import { requireSession } from "@/lib/guards";

import { Forbidden } from "@/components/shared/module-placeholder";

export const metadata = {
  title: "Master File Management",
};

export default async function Page() {
  await requireSession();

  // Belum ada kontrak permission file.
  return <Forbidden />;
}
