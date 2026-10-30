import type { UserDTO } from "@/features/users/types";

export type AccessSubject = Pick<
  UserDTO,
  "isActive" | "permissions"
>;

export function can(
  user: AccessSubject | null | undefined,
  permission: string,
): boolean {
  return Boolean(
    user?.isActive &&
    Array.isArray(user.permissions) &&
    user.permissions.includes(permission),
  );
}