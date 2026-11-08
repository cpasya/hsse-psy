// Normalized UI/session profile, not the raw backend Employee response.
export interface UserDTO {
  id: string;
  name: string;
  email: string;

  employeeId: string;
  image: string | null;

  status: "active" | "disabled";
  isActive: boolean;

  roleId: string | null;
  companyId: string | null;
  departmentId: string | null;
  jobPositionId: string | null;
  locationId: string | null;

  mustachePassword: boolean;

  permissions: string[];

  createdAt: string;
  updatedAt: string;
}
