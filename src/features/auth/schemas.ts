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

  employeeNumber: z.string().nullable(),

  status: z.enum([
    "pending",
    "active",
    "disabled",
  ]),

  roleId: z.string().uuid().nullable(),
  departmentId: z.string().uuid().nullable(),
  jobPositionId: z.string().uuid().nullable(),
  locationId: z.string().uuid().nullable(),

  mustachePassword: z.boolean(),

  permissions: z.array(
    z.string().min(1),
  ),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});