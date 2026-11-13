import test from "node:test";
import assert from "node:assert/strict";

import {
  readFileSync,
  existsSync,
  readdirSync,
} from "node:fs";

import { join } from "node:path";

import { createElement } from "react";

import {
  renderToStaticMarkup,
} from "react-dom/server";

import {
  Dashboard,
} from "../src/features/dashboard/components/dashboard";

import {
  IntegrationPending,
} from "../src/components/shared/integration-pending";

import { can } from "../src/lib/rbac";
import { getNavItems } from "../src/config/nav";

const root = process.cwd();

function text(path: string) {
  return readFileSync(
    join(root, path),
    "utf8",
  );
}

function walk(dir: string): string[] {
  return readdirSync(dir, {
    withFileTypes: true,
  }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(join(dir, entry.name))
      : [join(dir, entry.name)],
  );
}

test(
  "Initial password change keeps the Bearer token server-only",
  () => {
    const api = text(
      "src/features/auth/api.ts",
    );
    const route = text(
      "src/app/api/session/change-password/route.ts",
    );
    const form = text(
      "src/features/auth/components/change-password-form.tsx",
    );

    assert.ok(
      api.includes(
        'authRequest("/auth/change-password"',
      ),
    );
    assert.ok(
      api.includes(
        "confirm_password: payload.confirmPassword",
      ),
    );
    assert.ok(route.includes("token.accessToken"));
    assert.equal(form.includes("accessToken"), false);
  },
);

test(
  "No interception dependency, worker, fixture server or feature flags",
  () => {
    const pkg = JSON.parse(
      text("package.json"),
    );

    assert.equal(
      "msw" in pkg.dependencies,
      false,
    );

    assert.equal("msw" in pkg, false);
    assert.equal("demo" in pkg.scripts, false);

    assert.equal(
      "postinstall" in pkg.scripts,
      false,
    );

    for (const path of [
      "src/mocks",
      "src/providers/msw-provider.tsx",
      "public/mockServiceWorker.js",
      "scripts/demo.mjs",
      "scripts/demo-backend.mjs",
      "scripts/demo-backend-v2.mjs",
      "src/features/users/api.ts",
    ]) {
      assert.equal(
        existsSync(join(root, path)),
        false,
        path,
      );
    }

    assert.equal(
      /NEXT_PUBLIC_|MOCK|DEMO/.test(
        text(".env.example"),
      ),
      false,
    );
  },
);

test(
  "Runtime source has no registration, interception flags, seeded identities or deleted imports",
  () => {
    const files = walk(
      join(root, "src"),
    ).filter((file) =>
      /\.(ts|tsx)$/.test(file),
    );

    const forbidden =
      /MSWProvider|isMocking|isDemo|NEXT_PUBLIC_API_MOCKING|NEXT_PUBLIC_DEMO_MODE|worker\.start\(|serviceWorker\.register|@\/mocks|@\/features\/incident|@\/features\/users\/schemas|@\/features\/users\/hooks|@hsse\.demo|DemoHsse/;

    for (const file of files) {
      assert.equal(
        forbidden.test(
          readFileSync(file, "utf8"),
        ),
        false,
        file,
      );
    }

    assert.equal(
      text("src/app/layout.tsx").includes(
        "MSWProvider",
      ),
      false,
    );
  },
);

test(
  "Dashboard scaffold shows unavailable values, not operational zeros or seed records",
  () => {
    const html = renderToStaticMarkup(
      createElement(Dashboard, {}),
    );

    assert.equal(
      (
        html.match(
          /class="metric-value">—</g,
        ) || []
      ).length,
      4,
    );

    assert.ok(
      html.includes(
        "The dashboard data source has not been connected yet.",
      ),
    );

    assert.equal(
      /INC-2026|Plant A|Data dummy|85%/.test(
        html,
      ),
      false,
    );
  },
);

test(
  "Dashboard view model only renders values explicitly supplied by an adapter",
  () => {
    const html = renderToStaticMarkup(
      createElement(Dashboard, {
        data: {
          updatedAt:
            new Date(0).toISOString(),

          metrics: {
            incidents: 0,
            openActions: 7,
            highRisks: null,
            inspectionCompletion: 25,
          },
        },
      }),
    );

    assert.ok(
      html.includes(
        'class="metric-value">0<',
      ),
    );

    assert.ok(
      html.includes(
        'class="metric-value">7<',
      ),
    );

    assert.ok(
      html.includes(
        'class="metric-value">25%<',
      ),
    );

    assert.equal(
      (
        html.match(
          /class="metric-value">—</g,
        ) || []
      ).length,
      1,
    );
  },
);

test(
  "Pending module is a non-transactional shell",
  () => {
    const html = renderToStaticMarkup(
      createElement(IntegrationPending, {
        title: "Incident",
        description:
          "API integration pending",
      }),
    );

    assert.ok(
      html.includes(
        "Data source not connected",
      ),
    );

    assert.equal(
      /<form|<input|<table/.test(html),
      false,
    );
  },
);

test(
  "Navigation follows exact backend permissions, not role names",
  () => {
    const reader = {
      isActive: true,
      permissions: ["employees.read"],
    };

    assert.equal(
      can(reader, "employees.read"),
      true,
    );

    assert.equal(
      can(reader, "employees.create"),
      false,
    );

    assert.equal(
      can(null, "employees.read"),
      false,
    );

    assert.equal(
      can(
        {
          ...reader,
          isActive: false,
        },
        "employees.read",
      ),
      false,
    );

    assert.equal(
      getNavItems(reader).some(
        (item) =>
          item.href === "/users",
      ),
      true,
    );

    assert.equal(
      getNavItems({
        isActive: true,
        permissions: [],
      }).some(
        (item) =>
          item.href === "/users",
      ),
      false,
    );

    assert.equal(
      getNavItems(reader).some(
        (item) =>
          item.href === "/incident",
      ),
      false,
    );
  },
);
