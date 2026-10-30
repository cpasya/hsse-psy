import { requirePermission } from "@/lib/guards";

import { Forbidden } from "@/components/shared/module-placeholder";

import { UsersPage } from "@/features/users/components/users-page";

export const metadata = {
  title: "Master User",
};

export default async function Page() {
  const { allowed, session } = await requirePermission("employees.read");

  return allowed ? <UsersPage currentUser={session.user} /> : <Forbidden />;
}
