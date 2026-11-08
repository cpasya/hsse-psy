import { apiClient } from "@/lib/http";
import { parsePage } from "@/lib/pagination";

import {
  createJobPositionSchema,
  jobPositionSchema,
  updateJobPositionSchema,
  type CreateJobPositionPayload,
  type UpdateJobPositionPayload,
} from "./schemas";

export async function listJobPositions(params: {
  page: number;
  limit: number;
  search: string;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    search: params.search,
  });

  const raw = await apiClient.get<unknown>(`/job-positions?${query}`);
  return parsePage(raw, jobPositionSchema, params.page);
}

export async function getJobPosition(id: string) {
  const raw = await apiClient.get<unknown>(
    `/job-positions/${encodeURIComponent(id)}`,
  );

  return jobPositionSchema.parse(raw);
}

export async function createJobPosition(
  payload: CreateJobPositionPayload,
): Promise<void> {
  await apiClient.post<unknown>(
    "/job-positions",
    createJobPositionSchema.parse(payload),
  );
}

export async function updateJobPosition(
  id: string,
  payload: UpdateJobPositionPayload,
): Promise<void> {
  await apiClient.patch<unknown>(
    `/job-positions/${encodeURIComponent(id)}`,
    updateJobPositionSchema.parse(payload),
  );
}

export async function deleteJobPosition(id: string): Promise<void> {
  await apiClient.delete<unknown>(`/job-positions/${encodeURIComponent(id)}`);
}
