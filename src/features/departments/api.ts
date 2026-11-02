import { apiClient } from "@/lib/http";
import { parsePage } from "@/lib/pagination";

import {
  createDepartmentSchema,
  departmentSchema,
  updateDepartmentSchema,
  type CreateDepartmentPayload,
  type UpdateDepartmentPayload,
} from "./schemas";

export async function listDepartments(params: {
  page: number;
  limit: number;
  search: string;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    search: params.search,
  });

  const raw = await apiClient.get<unknown>(`/departments?${query}`);
  return parsePage(raw, departmentSchema, params.page);
}

export async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<void> {
  await apiClient.post<unknown>(
    "/departments",
    createDepartmentSchema.parse(payload),
  );
}

export async function updateDepartment(
  id: string,
  payload: UpdateDepartmentPayload,
): Promise<void> {
  await apiClient.patch<unknown>(
    `/departments/${encodeURIComponent(id)}`,
    updateDepartmentSchema.parse(payload),
  );
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete<unknown>(
    `/departments/${encodeURIComponent(id)}`,
  );
}
