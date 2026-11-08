import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
} from "../src/features/departments/api";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../src/features/departments/schemas";
import { getNavItems } from "../src/config/nav";

const id = "00000000-0000-4000-8000-000000000001";

test("Department payload follows the verified Swagger contract", () => {
  assert.deepEqual(
    createDepartmentSchema.parse({ name: "  Operations  " }),
    { name: "Operations" },
  );
  assert.equal(updateDepartmentSchema.safeParse({}).success, false);
  assert.equal(
    createDepartmentSchema.safeParse({ name: "HSSE", code: "X" }).success,
    false,
  );
});

test("Department CRUD uses the confirmed gateway endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{
    url: string;
    method: string;
    body: string;
  }> = [];

  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: String(init?.body ?? ""),
    });

    const data = init?.method === "GET"
      ? String(input) === `/api/gateway/departments/${id}`
        ? { id, name: "Operations" }
        : {
          data: [{ id, name: "Operations" }],
          total: 1,
          page: 1,
          limit: 20,
        }
      : null;

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const page = await listDepartments({
      page: 1,
      limit: 20,
      search: "ops",
    });
    const detail = await getDepartment(id);
    await createDepartment({ name: "Operations" });
    await updateDepartment(id, { name: "HSSE" });
    await deleteDepartment(id);

    assert.equal(page.data[0].name, "Operations");
    assert.equal(detail.name, "Operations");
    assert.deepEqual(requests, [
      {
        url: "/api/gateway/departments?page=1&limit=20&search=ops",
        method: "GET",
        body: "",
      },
      {
        url: `/api/gateway/departments/${id}`,
        method: "GET",
        body: "",
      },
      {
        url: "/api/gateway/departments",
        method: "POST",
        body: JSON.stringify({ name: "Operations" }),
      },
      {
        url: `/api/gateway/departments/${id}`,
        method: "PATCH",
        body: JSON.stringify({ name: "HSSE" }),
      },
      {
        url: `/api/gateway/departments/${id}`,
        method: "DELETE",
        body: "",
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Department navigation and route require exact read permission", () => {
  const active = {
    isActive: true,
    permissions: ["departments.read"],
  };

  assert.ok(
    getNavItems(active).some((item) => item.href === "/departments"),
  );
  assert.ok(
    !getNavItems({ ...active, permissions: [] }).some(
      (item) => item.href === "/departments",
    ),
  );

  const route = readFileSync(
    "src/app/(dashboard)/departments/page.tsx",
    "utf8",
  );
  const gateway = readFileSync(
    "src/app/api/gateway/[...path]/route.ts",
    "utf8",
  );

  assert.ok(route.includes('requirePermission("departments.read")'));
  assert.ok(gateway.includes('resource === "departments"'));
  assert.ok(gateway.includes("createDepartmentSchema"));
  assert.ok(gateway.includes("updateDepartmentSchema"));
});
