import type { UserDTO } from "@/features/users/types";
import {
  getEmployees,
} from "@/features/employees/api";
import type {
  EmployeeStatus,
} from "@/features/employees/schemas";

export type EmployeeFilters = {
  page: number;
  limit: number;
  search: string;
  status: EmployeeStatus | "";
};

export const initialEmployeeFilters: EmployeeFilters = {
  page: 1,
  limit: 20,
  search: "",
  status: "",
};

export function employeeListQuery(
  user: UserDTO | null,
  filters: EmployeeFilters,
) {
  const accessKey = JSON.stringify([
    user?.id,
    user?.roleId,
    user?.departmentId,
    user?.locationId,
    user?.jobPositionId,
    user?.updatedAt,
    user?.permissions,
  ]);

  return {
    queryKey: ["employees", accessKey, filters] as const,
    queryFn: () => getEmployees({
      ...filters,
      status: filters.status || undefined,
    }),
  };
}
