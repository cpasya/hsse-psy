import { apiClient } from "@/lib/http";

import {
  parsePage,
  type PageResult,
} from "@/lib/pagination";

import {
  assignRolePermissionsSchema,
  backendEmployeeSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  type BackendEmployee,
  type CreateEmployeePayload,
  type UpdateEmployeePayload,
  type EmployeeStatus,
} from "./schemas";

function unwrap(input: unknown): unknown {
  return (
    typeof input === "object" &&
    input !== null &&
    "data" in input
  )
    ? input.data
    : input;
}

function parseEmployee(input: unknown): BackendEmployee {
  const result = backendEmployeeSchema.safeParse(
    unwrap(input),
  );

  if (!result.success) {
    throw new Error(
      "Format respons employee berbeda dari kontrak",
    );
  }

  return result.data;
}

export async function getEmployees(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: EmployeeStatus;
}): Promise<PageResult<BackendEmployee>> {
  const page = params.page ?? 1;
  const query = new URLSearchParams();

  for (
    const [key, value] of Object.entries({
      ...params,
      page,
    })
  ) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }

  const raw = await apiClient.get<unknown>(
    "/employees?" + query,
  );

  // Jangan unwrap(raw) di sini:
  // raw sudah berupa body backend beserta metadata.
  return parsePage(raw, backendEmployeeSchema, page);
}

export async function createEmployee(
  payload: CreateEmployeePayload,
) {
  return parseEmployee(
    await apiClient.post<unknown>(
      "/employees",
      createEmployeeSchema.parse(payload),
    ),
  );
}

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload,
) {
  return parseEmployee(
    await apiClient.patch<unknown>(
      "/employees/" + encodeURIComponent(id),
      updateEmployeeSchema.parse(payload),
    ),
  );
}

export async function disableEmployee(
  id: string,
): Promise<void> {
  await apiClient.delete<unknown>(
    "/employees/" + encodeURIComponent(id),
  );
}

// Helper lama: halaman pertama saja, bukan katalog lengkap.
// Dropdown baru memakai getReferenceOptions().
export function getRoles(): Promise<unknown> {
  return apiClient.get<unknown>(
    "/roles?page=1&limit=100",
  );
}

export function getPermissions(): Promise<unknown> {
  return apiClient.get<unknown>(
    "/permissions?page=1&limit=100",
  );
}

export async function assignRolePermissions(
  roleId: string,
  permissionIds: string[],
): Promise<unknown> {
  const payload = assignRolePermissionsSchema.parse({
    permissionIds,
  });

  const response = await fetch(
    `/api/gateway/roles/${encodeURIComponent(roleId)}/permissions`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    },
  );

  const result: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      (
        typeof result === "object" &&
        result !== null &&
        "message" in result
      )
        ? String(result.message)
        : "Gagal memperbarui permission role",
    );
  }

  return unwrap(result);
}