import { z } from "zod";
export const employeeStatusSchema = z.enum(["pending", "active", "disabled"]);
const nullableUuid = z.string().uuid().nullable().optional();
const fields = {
  name: z.string().trim().min(1, "Nama wajib diisi"),
  employeeNumber: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  locationId: nullableUuid,
  roleId: nullableUuid,
  departmentId: nullableUuid,
  jobPositionId: nullableUuid,
  status: employeeStatusSchema,
};
export const createEmployeeSchema = z
  .object({
    ...fields,
    status: employeeStatusSchema.default("pending"),
    email: z.string().trim().email("Email tidak valid"),
    password: z.string().min(12, "Password minimal 12 karakter").max(128),
  })
  .strict();
export const updateEmployeeSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Tidak ada perubahan yang dikirim");
export const backendEmployeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  status: employeeStatusSchema,
  employeeNumber: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  roleId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  jobPositionId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  emailVerified: z.boolean().optional(),
  mustachePassword: z.boolean().optional(),
  image: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const assignRolePermissionsSchema = z
  .object({ permissionIds: z.array(z.string().uuid()) })
  .strict();
export type EmployeeStatus = z.infer<typeof employeeStatusSchema>;
export type BackendEmployee = z.infer<typeof backendEmployeeSchema>;
export type CreateEmployeePayload = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeePayload = z.infer<typeof updateEmployeeSchema>;
export type EmployeeFormValues = z.infer<typeof createEmployeeSchema>;