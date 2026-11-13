import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  password: z
    .string()
    .min(1, "Password is required"),

  rememberMe: z.boolean().optional(),
});

const strongPassword = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one symbol",
  );

export const changePasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .strict()
  .refine(
    (value) => value.password === value.confirmPassword,
    {
      message: "Password and confirmation must match",
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
