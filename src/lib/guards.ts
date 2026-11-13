import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cache } from "react";

import { authOptions } from "./auth";
import { can } from "./rbac";

export const requireSession = cache(async function requireSession() {
  const session = await getServerSession(
    authOptions,
  );

  if (
    session?.error === "ProfileUnavailable"
  ) {
    throw new Error(
      "Your access profile could not be verified. Try again when the service is available.",
    );
  }

  if (
    !session ||
    session.error ||
    !session.user?.isActive
  ) {
    redirect("/login");
  }

  return session;
});

export async function requirePermission(
  permission: string,
) {
  const session = await requireSession();

  return {
    session,
    allowed: can(
      session.user,
      permission,
    ),
  };
}
