// Unauthenticated browser smoke only. No fake API, synthetic session or live credentials.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
const port = Number(process.env.SMOKE_PORT || 3013),
  base = `http://localhost:${port}`;
const out = process.env.QA_DIR || "test-results";
await fs.mkdir(out, { recursive: true });
const log = createWriteStream(`${out}/smoke-server.log`);
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "-H",
    "127.0.0.1",
    "-p",
    String(port),
  ],
  {
    env: {
      ...process.env,
      NEXTAUTH_URL: base,
      NEXTAUTH_SECRET: randomBytes(48).toString("base64url"),
      API_BASE_URL:
        "https://backend-hsse.riyanwarsetiadi0605.workers.dev/api/v1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
child.stdout.pipe(log);
child.stderr.pipe(log);
let browser;
const checks = [],
  errors = [];
let external = 0;
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error("Server stopped");
    try {
      if ((await fetch(base + "/login")).ok) {
        ready = true;
        break;
      }
    } catch { }
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, "Server startup timeout");
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (req) => {
    if (new URL(req.url()).origin !== base) external++;
  });
  await page.goto(base + "/login");
  await page.getByLabel("Work email", { exact: true }).waitFor();
  await page.getByLabel("Password", { exact: true }).waitFor();
  assert.equal(await page.locator(".demo-credentials,.demo-banner").count(), 0);
  checks.push(
    "Login has only real credential fields and no demo banner/accounts",
  );
  const regs = await page.evaluate(async () =>
    "serviceWorker" in navigator
      ? (await navigator.serviceWorker.getRegistrations()).length
      : 0,
  );
  assert.equal(regs, 0);
  checks.push("Fresh browser registers no service worker");
  assert.equal(
    (await context.request.get(base + "/mockServiceWorker.js")).status(),
    404,
  );
  checks.push("Legacy worker asset absent");
  for (const route of [
    "/dashboard",
    "/change-password",
    "/departments",
    "/companies",
    "/job-positions",
    "/profile",
    "/users",
    "/users/00000000-0000-4000-8000-000000000001",
    "/incident",
    "/incident/new",
    "/incident/unknown",
  ]) {
    await page.goto(base + route);
    await page.waitForURL("**/login");
  }
  checks.push("All protected routes redirect without authentication");
  const unauthorized = await page.evaluate(() =>
    fetch("/api/gateway/employees").then((r) => r.status),
  );
  assert.equal(unauthorized, 401);
  const unsupported = await page.evaluate(() =>
    fetch("/api/gateway/dashboard").then((r) => r.status),
  );
  assert.equal(unsupported, 404);
  checks.push("No anonymous employee access and no guessed dashboard endpoint");
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const size = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(size.scroll <= size.width + 1);
    await page.screenshot({
      path: `${out}/login-${width}.png`,
      fullPage: true,
    });
  }
  checks.push("Login responsive overflow checks at 1440/1280/768/390");
  assert.equal(external, 0);
  assert.deepEqual(errors, []);
  checks.push("No browser external requests and no runtime errors");
  await fs.writeFile(
    `${out}/results.json`,
    JSON.stringify(
      {
        pass: true,
        scope: "unauthenticated-real-only-smoke-no-live-login",
        checks,
        browserErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS: ${checks.length} browser smoke groups; no live credentials or fake API.`,
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  child.kill("SIGTERM");
  await new Promise((r) => {
    if (child.exitCode !== null) return r();
    child.once("exit", r);
    setTimeout(() => {
      child.kill("SIGKILL");
      r();
    }, 5000).unref();
  });
  log.end();
}
