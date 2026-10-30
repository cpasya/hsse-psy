import type { Role } from "@/types";
// Normalized UI/session profile, not the raw backend Employee response.
export interface UserDTO {
  id: string;
  name: string;
  email: string;

  employeeId: string;

  status: "pending" | "active" | "disabled";
  isActive: boolean;

  roleId: string | null;
  departmentId: string | null;
  jobPositionId: string | null;
  locationId: string | null;

  mustachePassword: boolean;

  permissions: string[];

  createdAt: string;
  updatedAt: string;
}
