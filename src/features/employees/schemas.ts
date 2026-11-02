import { z } from "zod";
export const employeeStatusSchema = z.enum(["pending", "active", "disabled"]);
const nullableUuid = z.string().uuid().nullable().optional();
const mutableFields = {
  name: z.string().trim().min(1, "Nama wajib diisi"),
  employeeNumber: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  departmentId: nullableUuid,
  jobPositionId: nullableUuid,
  status: employeeStatusSchema,
};
export const createEmployeeSchema = z
  .object({
    name: mutableFields.name,
    employeeNumber: mutableFields.employeeNumber,
    phone: mutableFields.phone,
    departmentId: z.string().uuid("Department wajib dipilih"),
    jobPositionId: z.string().uuid("Job Position ID wajib berupa UUID"),
    email: z.string().trim().email("Email tidak valid"),
  })
  .strict();
export const updateEmployeeSchema = z
  .object(mutableFields)
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

export const employeePermissionSchema = z.object({
  id: z.string().uuid(),
  resource: z.string().trim().min(1),
  action: z.string().trim().min(1),
  isActive: z.boolean(),
});

export const employeeDetailSchema = backendEmployeeSchema.extend({
  permissions: z.array(employeePermissionSchema).refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    "Detail employee berisi permission duplikat",
  ),
});

export const assignRolePermissionsSchema = z
  .object({
    permissionIds: z.array(z.string().uuid()).refine(
      (items) => new Set(items).size === items.length,
      "Permission duplikat",
    ),
  })
  .strict();
export type EmployeeStatus = z.infer<typeof employeeStatusSchema>;
export type BackendEmployee = z.infer<typeof backendEmployeeSchema>;
export type EmployeeDetail = z.infer<typeof employeeDetailSchema>;
export type CreateEmployeePayload = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeePayload = z.infer<typeof updateEmployeeSchema>;
export type EmployeeFormValues = z.infer<typeof createEmployeeSchema>;

export function employeePermissionFingerprint(
  employee: EmployeeDetail,
): string {
  return JSON.stringify({
    updatedAt: employee.updatedAt,
    permissions: employee.permissions
      .map((permission) => `${permission.id}:${permission.isActive}`)
      .sort(),
  });
}
