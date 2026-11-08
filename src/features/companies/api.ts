import { apiClient } from "@/lib/http";
import { parsePage } from "@/lib/pagination";

import {
  companySchema,
  createCompanySchema,
  updateCompanySchema,
  type CreateCompanyPayload,
  type UpdateCompanyPayload,
} from "./schemas";

export async function listCompanies(params: {
  page: number;
  limit: number;
  search: string;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    search: params.search,
  });

  const raw = await apiClient.get<unknown>(`/companies?${query}`);
  return parsePage(raw, companySchema, params.page);
}

export async function getCompany(id: string) {
  const raw = await apiClient.get<unknown>(
    `/companies/${encodeURIComponent(id)}`,
  );

  return companySchema.parse(raw);
}

export async function createCompany(
  payload: CreateCompanyPayload,
): Promise<void> {
  await apiClient.post<unknown>(
    "/companies",
    createCompanySchema.parse(payload),
  );
}

export async function updateCompany(
  id: string,
  payload: UpdateCompanyPayload,
): Promise<void> {
  await apiClient.patch<unknown>(
    `/companies/${encodeURIComponent(id)}`,
    updateCompanySchema.parse(payload),
  );
}

export async function deleteCompany(id: string): Promise<void> {
  await apiClient.delete<unknown>(`/companies/${encodeURIComponent(id)}`);
}
