import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";

import { serverEnv } from "@/config/env";
import { loadEffectiveToken } from "@/lib/session-access";
import { can } from "@/lib/rbac";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "@/features/employees/schemas";

import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  updatePermissionSchema,
  assignmentSchema,
} from "@/features/access/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uuid = z.string().uuid();

function allowed(parts: string[], method: string) {
  const [resource, id, child] = parts;

  if (parts.length === 1 && resource === "me") {
    return method === "GET";
  }

  if (
    ["employees", "roles", "permissions"].includes(resource)
  ) {
    if (parts.length === 1) {
      return ["GET", "POST"].includes(method);
    }

    if (!uuid.safeParse(id).success) return false;

    if (parts.length === 2) {
      return ["GET", "PATCH", "DELETE"].includes(method);
    }

    return (
      resource === "roles" &&
      parts.length === 3 &&
      child === "permissions" &&
      method === "PUT"
    );
  }

  return (
    ["departments", "locations"].includes(resource) &&
    method === "GET" &&
    (
      parts.length === 1 ||
      (
        parts.length === 2 &&
        uuid.safeParse(id).success
      )
    )
  );
}

function fail(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function message(input: unknown) {
  if (
    typeof input === "object" &&
    input !== null &&
    "message" in input
  ) {
    if (Array.isArray(input.message)) {
      return input.message.map(String).join(", ");
    }

    if (typeof input.message === "string") {
      return input.message;
    }
  }

  return "Request ditolak oleh backend";
}

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  if (!allowed(params.path, req.method)) {
    return fail(
      "Endpoint atau method belum didukung gateway",
      404,
    );
  }

  const env = serverEnv();

  if (
    req.method !== "GET" &&
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

  let token = await loadEffectiveToken(raw);

  function sessionFailure() {
    return fail(
      token.error === "ProfileUnavailable"
        ? "Profil akses belum dapat diverifikasi"
        : "Sesi tidak aktif",
      token.error === "ProfileUnavailable"
        ? 503
        : token.error === "AccountInactive"
          ? 403
          : 401,
    );
  }

  if (token.error) return sessionFailure();

  if (!token.profile.isActive) {
    return fail("Akun tidak aktif", 403);
  }

  const [resource, id] = params.path;

  const permission = resource === "me"
    ? null
    : params.path[2] === "permissions"
      ? "roles.assign"
      : `${resource}.${req.method === "GET"
        ? "read"
        : req.method === "POST"
          ? "create"
          : req.method === "PATCH"
            ? "update"
            : "delete"
      }`;

  function denied() {
    if (
      permission &&
      !can(token.profile, permission)
    ) {
      return fail("Permission tidak mencukupi", 403);
    }

    if (
      resource === "roles" &&
      id === token.profile.roleId &&
      req.method !== "GET"
    ) {
      return fail(
        "Pengaman aplikasi: role akun sendiri tidak boleh diubah/dihapus",
        403,
      );
    }

    if (
      resource === "employees" &&
      id === token.profile.id &&
      req.method === "DELETE"
    ) {
      return fail(
        "Tidak dapat menonaktifkan akun sendiri",
        403,
      );
    }

    return null;
  }

  const denial = denied();
  if (denial) return denial;

  let body: string | undefined;

  if (["POST", "PATCH", "PUT"].includes(req.method)) {
    try {
      const text = await req.text();

      if (
        new TextEncoder().encode(text).length > 65_536
      ) {
        return fail("Payload terlalu besar", 413);
      }

      const input: unknown = JSON.parse(text);

      const schema = resource === "employees"
        ? req.method === "POST"
          ? createEmployeeSchema
          : updateEmployeeSchema
        : resource === "roles"
          ? req.method === "PUT"
            ? assignmentSchema
            : req.method === "POST"
              ? createRoleSchema
              : updateRoleSchema
          : req.method === "POST"
            ? createPermissionSchema
            : updatePermissionSchema;

      const parsed = schema.parse(input);

      if (
        resource === "employees" &&
        id === token.profile.id &&
        "status" in parsed &&
        parsed.status === "disabled"
      ) {
        return fail(
          "Tidak dapat menonaktifkan akun sendiri",
          403,
        );
      }

      body = JSON.stringify(parsed);
    } catch (error) {
      return fail(
        error instanceof z.ZodError
          ? error.issues
            .map((issue) => issue.message)
            .join(", ")
          : "Payload JSON tidak valid",
        422,
      );
    }
  }

  const query = new URLSearchParams();

  for (const key of ["page", "limit", "search"]) {
    const value = req.nextUrl.searchParams.get(key);

    if (value !== null) {
      query.set(key, value);
    }
  }

  const status = req.nextUrl.searchParams.get("status");

  if (resource === "employees" && status !== null) {
    if (
      !["pending", "active", "disabled"].includes(status)
    ) {
      return fail("Filter status tidak valid", 422);
    }

    query.set("status", status);
  }

  const path = params.path
    .map(encodeURIComponent)
    .join("/");

  const url =
    `${env.API_BASE_URL.replace(/\/$/, "")}/${path}` +
    (query.size ? "?" + query : "");

  const send = () =>
    fetch(url, {
      method: req.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.accessToken}`,
      },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });

  try {
    let response = await send();

    if (response.status === 401) {
      token = await loadEffectiveToken(token, true);

      if (token.error) return sessionFailure();

      const refreshedDenial = denied();
      if (refreshedDenial) return refreshedDenial;

      // Ulangi self-disable check jika profil berubah
      // setelah refresh.
      if (
        resource === "employees" &&
        id === token.profile.id &&
        body &&
        JSON.parse(body).status === "disabled"
      ) {
        return fail(
          "Tidak dapat menonaktifkan akun sendiri",
          403,
        );
      }

      response = await send();
    }

    const text = await response.text();
    let json: unknown = null;

    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        return fail(
          "Respons backend bukan JSON yang valid",
          502,
        );
      }
    }

    if (!response.ok) {
      return fail(message(json), response.status);
    }

    return NextResponse.json(
      { data: json },
      {
        status:
          response.status === 204
            ? 200
            : response.status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return fail(
      "Backend tidak dapat dihubungi",
      502,
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};