import { meResponseSchema } from "./schemas";
import type { UserDTO } from "@/features/users/types";

export function toFrontendProfile(
  input: unknown,
): UserDTO {
  const user = meResponseSchema.parse(input);

  return {
    id: user.id,
    name: user.name,
    email: user.email,

    employeeId: user.employeeNumber ?? "",

    status: user.status,
    isActive: user.status === "active",

    roleId: user.roleId,
    departmentId: user.departmentId,
    jobPositionId: user.jobPositionId,
    locationId: user.locationId,

    mustachePassword: user.mustachePassword,

    // Hilangkan duplikat tanpa menambah permission apa pun.
    permissions: [...new Set(user.permissions)].sort(),

    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}