export const roles = [
  "super_admin",
  "admin",
  "hsse_officer",
  "supervisor",
  "viewer",
] as const;
export type Role = (typeof roles)[number];
export const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  hsse_officer: "HSSE Officer",
  supervisor: "Supervisor",
  viewer: "Viewer",
};

export const knownPermissions = [
  "employees.read",
  "employees.create",
  "employees.update",
  "employees.delete",

  "departments.read",
  "departments.create",
  "departments.update",
  "departments.delete",

  "locations.read",
  "locations.create",
  "locations.update",
  "locations.delete",

  "roles.read",
  "roles.create",
  "roles.update",
  "roles.delete",

  "permissions.read",
  "permissions.create",
  "permissions.update",
  "permissions.delete",

  "roles.assign",
] as const;

export type Permission = (typeof knownPermissions)[number];

export type SessionAccessError =
  | "RefreshAccessTokenError"
  | "ProfileUnavailable"
  | "AccountInactive";