import "server-only";

import { z } from "zod";

import { serverEnv } from "@/config/env";
import { cachedProfile } from "@/lib/profile-cache";

import { authTokensSchema } from "./schemas";
import type { ChangePasswordInput } from "./schemas";
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
      "The authentication service could not be reached",
    );
  }

  if (!response.ok) {
    throw new AuthApiError(
      response.status,

      response.status === 401 ||
        response.status === 403
        ? "Authentication was rejected. Check your account or sign in again."
        : `Authentication service failed (${response.status})`,
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
      "Invalid authentication response",
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
  force = false,
): Promise<UserDTO> {
  return cachedProfile(accessToken, async () => {
    const raw = await authRequest("/me", {
      bearer: accessToken,
    });

    try {
      return toFrontendProfile(raw);
    } catch (error) {
      const fields = error instanceof z.ZodError
        ? error.issues
          .map((issue) => issue.path.join("."))
          .filter(Boolean)
          .join(", ")
        : "unknown";

      throw new AuthApiError(
        502,
        `The backend profile/permissions response does not match the expected format (${fields})`,
      );
    }
  }, force);
}

export async function logout(
  refreshToken: string,
): Promise<void> {
  await authRequest("/auth/sign-out", {
    method: "POST",
    bearer: refreshToken,
  });
}

export async function changePassword(
  accessToken: string,
  payload: ChangePasswordInput,
): Promise<void> {
  await authRequest("/auth/change-password", {
    method: "POST",
    bearer: accessToken,
    body: {
      password: payload.password,
      confirm_password: payload.confirmPassword,
    },
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
      "The login response does not match the expected format",
    );
  }

  try {
    const profile = await getProfile(
      result.data.accessToken,
    );

    if (profile.id !== result.data.user.id) {
      throw new AuthApiError(
        401,
        "Session identity mismatch",
      );
    }

    if (!profile.isActive) {
      throw new AuthApiError(
        403,
        "The account is not active or has been disabled",
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
      "The refresh response does not match the expected format",
    );
  }

  return {
    ...result.data,
    refreshToken:
      result.data.refreshToken ?? current,
  };
}
