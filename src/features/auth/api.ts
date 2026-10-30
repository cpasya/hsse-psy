import "server-only";

import { z } from "zod";

import { serverEnv } from "@/config/env";

import { authTokensSchema } from "./schemas";
import { toFrontendProfile } from "./backend-profile";

import type { UserDTO } from "@/features/users/types";

import type {
  AuthTokens,
  LoginPayload,
  LoginResponseDTO,
} from "./types";

export class AuthApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function authRequest(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    bearer?: string;
  } = {},
): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.bearer) {
    headers.Authorization =
      `Bearer ${options.bearer}`;
  }

  let response: Response;

  try {
    response = await fetch(
      `${serverEnv().API_BASE_URL.replace(/\/$/, "")}${path}`,
      {
        method: options.method ?? "GET",
        headers,

        body:
          options.body === undefined
            ? undefined
            : JSON.stringify(options.body),

        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    throw new AuthApiError(
      502,
      "Layanan autentikasi tidak dapat dihubungi",
    );
  }

  if (!response.ok) {
    throw new AuthApiError(
      response.status,

      response.status === 401 ||
        response.status === 403
        ? "Autentikasi ditolak. Periksa akun atau login kembali."
        : `Layanan autentikasi gagal (${response.status})`,
    );
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  let json: unknown;

  try {
    json = JSON.parse(text);
  } catch {
    throw new AuthApiError(
      502,
      "Respons autentikasi tidak valid",
    );
  }

  // Mendukung respons langsung maupun envelope data.
  if (
    typeof json === "object" &&
    json !== null &&
    "data" in json
  ) {
    return json.data;
  }

  return json;
}

export async function getProfile(
  accessToken: string,
): Promise<UserDTO> {
  const raw = await authRequest("/me", {
    bearer: accessToken,
  });

  try {
    return toFrontendProfile(raw);
  } catch {
    throw new AuthApiError(
      502,
      "Format profil/permissions backend tidak sesuai kontrak",
    );
  }
}

export async function logout(
  refreshToken: string,
): Promise<void> {
  await authRequest("/auth/sign-out", {
    method: "POST",
    bearer: refreshToken,
  });
}

export async function login(
  payload: LoginPayload,
): Promise<LoginResponseDTO> {
  const schema = authTokensSchema.extend({
    user: z.object({
      id: z.string().uuid(),
    }),
  });

  const result = schema.safeParse(
    await authRequest("/auth/sign-in/email", {
      method: "POST",

      body: {
        ...payload,
        rememberMe: payload.rememberMe ?? true,
      },
    }),
  );

  if (!result.success) {
    throw new AuthApiError(
      502,
      "Format respons login tidak sesuai kontrak",
    );
  }

  try {
    const profile = await getProfile(
      result.data.accessToken,
    );

    if (profile.id !== result.data.user.id) {
      throw new AuthApiError(
        401,
        "Identitas sesi tidak sesuai",
      );
    }

    if (!profile.isActive) {
      throw new AuthApiError(
        403,
        "Akun belum aktif atau telah dinonaktifkan",
      );
    }

    return {
      ...result.data,
      user: profile,
    };
  } catch (error) {
    // Login backend sudah membuat sesi.
    // Kalau profil gagal diverifikasi, coba cabut sesi itu.
    try {
      await logout(result.data.refreshToken);
    } catch {
      // Jangan menutupi error verifikasi profil yang utama.
    }

    throw error;
  }
}

export async function refreshToken(
  current: string,
): Promise<AuthTokens> {
  const schema = authTokensSchema.extend({
    refreshToken: z.string().min(1).optional(),
  });

  const result = schema.safeParse(
    await authRequest("/auth/refresh", {
      method: "POST",
      bearer: current,
    }),
  );

  if (!result.success) {
    throw new AuthApiError(
      502,
      "Format respons refresh tidak sesuai kontrak",
    );
  }

  return {
    ...result.data,
    refreshToken:
      result.data.refreshToken ?? current,
  };
}