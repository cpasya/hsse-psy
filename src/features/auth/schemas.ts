import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email tidak valid"),

  password: z
    .string()
    .min(1, "Password wajib diisi"),

  rememberMe: z.boolean().optional(),
});

const strongPassword = z
  .string()
  .min(12, "Password minimal 12 karakter")
  .max(128, "Password maksimal 128 karakter")
  .regex(/[A-Z]/, "Password harus memiliki minimal satu huruf kapital")
  .regex(/[0-9]/, "Password harus memiliki minimal satu angka")
  .regex(
    /[^A-Za-z0-9]/,
    "Password harus memiliki minimal satu simbol",
  );

export const changePasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .strict()
  .refine(
    (value) => value.password === value.confirmPassword,
    {
      message: "Password dan konfirmasi password harus sama",
      path: ["confirmPassword"],
    },
  );

export type ChangePasswordInput = z.infer<
  typeof changePasswordSchema
>;

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),

  expiresIn: z.number().positive(),

  refreshTokenExpiresAt: z
    .string()
    .datetime()
    .optional(),
});

export const meResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),

  employeeNumber: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),

  status: z.enum(["active", "disabled"]),

  roleId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  jobPositionId: z.string().uuid().nullable().optional(),
  locationId: z.string().uuid().nullable().optional(),

  mustachePassword: z.boolean().optional().default(false),

  permissions: z.array(
    z.string().min(1),
  ),

  createdAt: z.string().optional().default(""),
  updatedAt: z.string().optional().default(""),
});
