export const knownPermissions = [
  "employees.read",
  "employees.create",
  "employees.update",
  "employees.delete",

  "departments.read",
  "departments.create",
  "departments.update",
  "departments.delete",

  "companies.read",
  "companies.create",
  "companies.update",
  "companies.delete",

  "job-positions.read",
  "job-positions.create",
  "job-positions.update",
  "job-positions.delete",

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
