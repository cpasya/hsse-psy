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

    roleId: user.roleId ?? null,
    departmentId: user.departmentId ?? null,
    jobPositionId: user.jobPositionId ?? null,
    locationId: user.locationId ?? null,

    mustachePassword: user.mustachePassword,

    //Ini untuk hilangkan duplikat tanpa menambah permission apa pun.
    permissions: [...new Set(user.permissions)].sort(),

    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
