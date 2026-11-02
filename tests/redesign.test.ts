import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StatusBadge } from "../src/components/shared/status-badge";

test("Employee backend statuses have explicit semantic badges", () => {
  for (const [status, tone] of [
    ["active", "success"],
    ["pending", "warning"],
    ["disabled", "neutral"],
  ]) {
    const html = renderToStaticMarkup(createElement(StatusBadge, { status }));
    assert.ok(html.includes(`badge ${tone}`));
    assert.ok(html.includes(status)); // labels remain present, not color-only.
  }
});

test("TailAdmin adaptation retains notices, responsive and keyboard foundations", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(css.includes("prefers-color-scheme: dark"));
  assert.ok(css.includes("html.dark"));
  assert.ok(css.includes(".table-scroll"));
  assert.ok(css.includes(":focus-visible"));
  assert.ok(existsSync("licenses/TailAdmin-MIT.txt"));
  assert.ok(existsSync("public/images/shape/grid-01.svg"));
  assert.ok(
    !readFileSync(".env.example", "utf8").includes("HSSE_FRONTEND_ROLE_MAP"),
  );
  const sidebar = readFileSync("src/components/layout/sidebar.tsx", "utf8");
  assert.ok(sidebar.includes('event.key === "Escape"'));
  assert.ok(sidebar.includes("body.inert = true"));
  const themeToggle = readFileSync(
    "src/components/layout/theme-toggle.tsx",
    "utf8",
  );
  assert.ok(themeToggle.includes('localStorage.setItem(storageKey'));
  assert.ok(themeToggle.includes('aria-pressed={dark}'));
});

test("Dashboard modals share smooth accessible transitions", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const users = readFileSync(
    "src/features/users/components/users-page.tsx",
    "utf8",
  );
  const access = readFileSync(
    "src/features/access/components/access-page.tsx",
    "utf8",
  );

  assert.ok(css.includes('.modal-overlay[data-state="open"]'));
  assert.ok(css.includes('.modal-overlay[data-state="closed"]'));
  assert.ok(css.includes('.modal-content[data-state="open"]'));
  assert.ok(css.includes('.modal-content[data-state="closed"]'));
  assert.ok(css.includes("@keyframes modal-content-in"));
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(users.includes('className="employee-form-modal"'));
  assert.ok(access.includes('className="access-editor-modal"'));
  assert.ok(existsSync(".cursor/rules/modal-ux.mdc"));
});
