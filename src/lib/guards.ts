import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "./auth";
import { can } from "./rbac";

export async function requireSession() {
  const session = await getServerSession(
    authOptions,
  );

  if (
    session?.error === "ProfileUnavailable"
  ) {
    throw new Error(
      "Profil akses belum dapat diverifikasi. Coba lagi saat layanan tersedia.",
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
}

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