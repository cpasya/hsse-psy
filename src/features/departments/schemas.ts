import { z } from "zod";

const name = z.string().trim().min(1, "Nama department wajib diisi");

export const departmentSchema = z.object({
  id: z.string().uuid(),
  name,
});

export const createDepartmentSchema = z.object({
  name,
}).strict();

export const updateDepartmentSchema = createDepartmentSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Tidak ada perubahan",
  );

export type DepartmentRecord = z.infer<typeof departmentSchema>;
export type CreateDepartmentPayload = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentPayload = z.infer<typeof updateDepartmentSchema>;
