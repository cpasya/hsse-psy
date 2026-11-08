import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "../src/features/companies/api";
import { createCompanySchema } from "../src/features/companies/schemas";
import {
  createJobPosition,
  deleteJobPosition,
  getJobPosition,
  listJobPositions,
  updateJobPosition,
} from "../src/features/job-positions/api";
import { createJobPositionSchema } from "../src/features/job-positions/schemas";
import { getNavItems } from "../src/config/nav";
import { REFERENCE_FIELDS } from "../src/features/references/selection";

const id = "00000000-0000-4000-8000-000000000001";

test("Company and job-position payloads follow Swagger", () => {
  assert.deepEqual(
    createCompanySchema.parse({
      companyName: "  PT HSSE  ",
      companyAddress: "  Jakarta  ",
    }),
    {
      companyName: "PT HSSE",
      companyAddress: "Jakarta",
    },
  );
  assert.equal(
    createCompanySchema.safeParse({ companyName: "PT HSSE" }).success,
    false,
  );
  assert.deepEqual(createJobPositionSchema.parse({ name: "  Supervisor  " }), {
    name: "Supervisor",
  });
});

test("Company and job-position CRUD use their gateway endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; method: string }> = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, method: init?.method ?? "GET" });
    const isGet = (init?.method ?? "GET") === "GET";
    const isDetail = url.endsWith(`/${id}`);
    const data = isGet
      ? isDetail
        ? url.includes("job-positions")
          ? { id, name: "Supervisor" }
          : {
              id,
              companyName: "PT HSSE",
              companyAddress: "Jakarta",
              companyDescription: null,
              companyBusiness: null,
            }
        : url.includes("job-positions")
          ? { data: [{ id, name: "Supervisor" }], total: 1, page: 1, limit: 20 }
          : {
              data: [
                {
                  id,
                  companyName: "PT HSSE",
                  companyAddress: "Jakarta",
                  companyDescription: null,
                  companyBusiness: null,
                },
              ],
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
    await listCompanies({ page: 1, limit: 20, search: "hsse" });
    await getCompany(id);
    await createCompany({ companyName: "PT HSSE", companyAddress: "Jakarta" });
    await updateCompany(id, { companyAddress: "Bandung" });
    await deleteCompany(id);
    await listJobPositions({ page: 1, limit: 20, search: "super" });
    await getJobPosition(id);
    await createJobPosition({ name: "Supervisor" });
    await updateJobPosition(id, { name: "Manager" });
    await deleteJobPosition(id);

    assert.deepEqual(requests, [
      {
        url: "/api/gateway/companies?page=1&limit=20&search=hsse",
        method: "GET",
      },
      { url: `/api/gateway/companies/${id}`, method: "GET" },
      { url: "/api/gateway/companies", method: "POST" },
      { url: `/api/gateway/companies/${id}`, method: "PATCH" },
      { url: `/api/gateway/companies/${id}`, method: "DELETE" },
      {
        url: "/api/gateway/job-positions?page=1&limit=20&search=super",
        method: "GET",
      },
      { url: `/api/gateway/job-positions/${id}`, method: "GET" },
      { url: "/api/gateway/job-positions", method: "POST" },
      { url: `/api/gateway/job-positions/${id}`, method: "PATCH" },
      { url: `/api/gateway/job-positions/${id}`, method: "DELETE" },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Navigation, routes, gateway, and employee picker use exact permissions", () => {
  const user = {
    isActive: true,
    permissions: ["companies.read", "job-positions.read"],
  };
  const hrefs = getNavItems(user).map((item) => item.href);
  assert.ok(hrefs.includes("/companies"));
  assert.ok(hrefs.includes("/job-positions"));
  assert.ok(
    REFERENCE_FIELDS.some(
      (field) =>
        field.key === "jobPositionId" && field.resource === "job-positions",
    ),
  );

  const gateway = readFileSync(
    "src/app/api/gateway/[...path]/route.ts",
    "utf8",
  );
  const companiesRoute = readFileSync(
    "src/app/(dashboard)/companies/page.tsx",
    "utf8",
  );
  const jobsRoute = readFileSync(
    "src/app/(dashboard)/job-positions/page.tsx",
    "utf8",
  );
  const topbar = readFileSync("src/components/layout/topbar.tsx", "utf8");
  const profile = readFileSync(
    "src/features/users/components/profile-page.tsx",
    "utf8",
  );
  const profileRoute = readFileSync(
    "src/app/(dashboard)/profile/page.tsx",
    "utf8",
  );
  assert.ok(gateway.includes('"companies"'));
  assert.ok(gateway.includes('"job-positions"'));
  assert.ok(companiesRoute.includes('requirePermission("companies.read")'));
  assert.ok(jobsRoute.includes('requirePermission("job-positions.read")'));
  assert.ok(!topbar.includes("Role ID"));
  assert.ok(topbar.includes("Account Settings"));
  assert.ok(topbar.includes('href="/profile"'));
  assert.ok(topbar.includes('fetch("/api/session/logout"'));
  assert.ok(profile.includes("getDepartment"));
  assert.ok(profile.includes("getJobPosition"));
  assert.ok(profile.includes("getCompany"));
  assert.ok(profile.includes("Tabel hak akses efektif"));
  assert.ok(profile.includes("ChangePasswordForm"));
  assert.ok(profileRoute.includes("requireSession()"));
});
