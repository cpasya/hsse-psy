import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import {
  AuthApiError,
  changePassword,
} from "@/features/auth/api";
import { changePasswordSchema } from "@/features/auth/schemas";
import { serverEnv } from "@/config/env";
import { loadEffectiveToken } from "@/lib/session-access";

export const runtime = "nodejs";

function fail(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function POST(req: NextRequest) {
  const env = serverEnv();

  if (
    req.headers.get("origin") !==
    new URL(env.NEXTAUTH_URL).origin
  ) {
    return fail("Origin ditolak", 403);
  }

  const raw = await getToken({
    req,
    secret: env.NEXTAUTH_SECRET,
  });

  if (!raw) {
    return fail("Silakan login kembali", 401);
  }

  let input: unknown;

  try {
    const text = await req.text();

    if (
      new TextEncoder().encode(text).length > 8_192
    ) {
      return fail("Payload terlalu besar", 413);
    }

    input = JSON.parse(text);
  } catch {
    return fail("Payload JSON tidak valid", 422);
  }

  const parsed = changePasswordSchema.safeParse(input);

  if (!parsed.success) {
    return fail(
      parsed.error.issues
        .map((issue) => issue.message)
        .join(", "),
      422,
    );
  }

  const token = await loadEffectiveToken(raw);

  if (token.error || !token.accessToken) {
    return fail("Sesi tidak aktif", 401);
  }

  try {
    await changePassword(
      token.accessToken,
      parsed.data,
    );

    return NextResponse.json(
      { success: true },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return fail(
      error instanceof AuthApiError
        ? error.message
        : "Password gagal diubah",
      error instanceof AuthApiError
        ? error.statusCode
        : 502,
    );
  }
}
