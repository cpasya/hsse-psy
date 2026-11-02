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
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@/features/departments/schemas";
import { unwrapBackendEnvelope } from "../backend-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uuid = z.string().uuid();

function allowed(parts: string[], method: string) {
  const [resource, id, child] = parts;

  if (parts.length === 1 && resource === "me") {
    return method === "GET";
  }

  if (
    ["employees", "roles", "permissions", "departments"].includes(resource)
  ) {
    if (parts.length === 1) {
      return ["GET", "POST"].includes(method);
    }

    if (!uuid.safeParse(id).success) return false;

    if (parts.length === 2) {
      return ["GET", "PATCH", "DELETE"].includes(method);
    }

    return (
      ["roles", "employees"].includes(resource) &&
      parts.length === 3 &&
      child === "permissions" &&
      method === "PUT"
    );
  }

  return (
    resource === "locations" &&
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

function fail(
  message: string,
  status: number,
  headers: HeadersInit = {},
) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...headers,
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
  const startedAt = performance.now();

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

  const sessionStartedAt = performance.now();
  const raw = await getToken({
    req,
    secret: env.NEXTAUTH_SECRET,
  });

  if (!raw) {
    return fail("Silakan login kembali", 401);
  }

  let token = await loadEffectiveToken(raw);
  let sessionDuration = performance.now() - sessionStartedAt;
  let backendDuration = 0;

  const timingHeaders = () => ({
    "Server-Timing": [
      `session;dur=${sessionDuration.toFixed(1)}`,
      `backend;dur=${backendDuration.toFixed(1)}`,
      `total;dur=${(performance.now() - startedAt).toFixed(1)}`,
    ].join(", "),
  });

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
      ? resource === "roles"
        ? "roles.assign"
        : "employees.update"
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
      (
        req.method === "DELETE" ||
        (
          req.method === "PUT" &&
          params.path[2] === "permissions"
        )
      )
    ) {
      return fail(
        req.method === "DELETE"
          ? "Tidak dapat menonaktifkan akun sendiri"
          : "Tidak dapat mengubah hak akses akun sendiri",
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

      const schema = params.path[2] === "permissions"
        ? assignmentSchema
        : resource === "employees"
        ? req.method === "POST"
          ? createEmployeeSchema
          : updateEmployeeSchema
        : resource === "roles"
          ? req.method === "PUT"
            ? assignmentSchema
            : req.method === "POST"
              ? createRoleSchema
              : updateRoleSchema
          : resource === "departments"
            ? req.method === "POST"
              ? createDepartmentSchema
              : updateDepartmentSchema
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

  const send = async () => {
    const backendStartedAt = performance.now();

    try {
      return await fetch(url, {
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
    } finally {
      backendDuration += performance.now() - backendStartedAt;
    }
  };

  try {
    let response = await send();

    if (response.status === 401) {
      const refreshStartedAt = performance.now();
      token = await loadEffectiveToken(token, true);
      sessionDuration += performance.now() - refreshStartedAt;

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
          timingHeaders(),
        );
      }
    }

    if (!response.ok) {
      return fail(
        message(json),
        response.status,
        timingHeaders(),
      );
    }

    return NextResponse.json(
      { data: unwrapBackendEnvelope(json) },
      {
        status:
          response.status === 204
            ? 200
            : response.status,
        headers: {
          "Cache-Control": "no-store",
          ...timingHeaders(),
        },
      },
    );
  } catch {
    return fail(
      "Backend tidak dapat dihubungi",
      502,
      timingHeaders(),
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
