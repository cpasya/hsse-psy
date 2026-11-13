import { z } from "zod";

const name = z.string().trim().min(1, "Job position name is required");

export const jobPositionSchema = z.object({
  id: z.string().uuid(),
  name,
});

export const createJobPositionSchema = z.object({ name }).strict();

export const updateJobPositionSchema = createJobPositionSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No changes were submitted");

export type JobPositionRecord = z.infer<typeof jobPositionSchema>;
export type CreateJobPositionPayload = z.infer<typeof createJobPositionSchema>;
export type UpdateJobPositionPayload = z.infer<typeof updateJobPositionSchema>;
