"use client";

import { useSession } from "next-auth/react";

import { can } from "@/lib/rbac";
import type { Permission } from "@/types";

export function PermissionGate({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { data, status } = useSession();

  const allowed =
    status === "authenticated" &&
    !data?.error &&
    can(data?.user, permission);

  return allowed ? <>{children}</> : null;
}