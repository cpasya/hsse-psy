import { z } from "zod";
export const employeeStatusSchema = z.enum(["active", "disabled"]);
export const MAX_EMPLOYEE_IMAGE_BYTES = 2 * 1024 * 1024;
export const employeeImageSchema = z
  .file()
  .max(MAX_EMPLOYEE_IMAGE_BYTES, "The profile photo must be 2 MB or smaller")
  .mime(["image/jpeg", "image/png"], "The profile photo must be a JPEG or PNG");
const nullableUuid = z.string().uuid().nullable().optional();
const mutableFields = {
  name: z.string().trim().min(1, "Name is required"),
  employeeNumber: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  departmentId: nullableUuid,
  jobPositionId: nullableUuid,
  status: employeeStatusSchema,
  image: employeeImageSchema.optional(),
};
export const createEmployeeSchema = z
  .object({
    name: mutableFields.name,
    employeeNumber: mutableFields.employeeNumber,
    phone: mutableFields.phone,
    departmentId: z.string().uuid("Department is required"),
    jobPositionId: z.string().uuid("Job Position ID must be a UUID"),
    email: z.string().trim().email("Invalid email address"),
    image: mutableFields.image,
  })
  .strict();
export const updateEmployeeSchema = z
  .object(mutableFields)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "No changes were submitted");
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
  image: z.string().url().nullable().optional(),
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
    "Employee details contain duplicate permissions",
  ),
});

export const assignRolePermissionsSchema = z
  .object({
    permissionIds: z.array(z.string().uuid()).refine(
      (items) => new Set(items).size === items.length,
      "Duplicate permissions",
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
