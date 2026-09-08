import { defineConfig, devices } from "@playwright/test";

/**
 * E2E smoke-test config for FlowERP — Chromium only, per the M4 task scope
 * ("Playwright + Chromium E2E environment"). Specs live in ./e2e.
 *
 * webServer boots the full stack (frontend + backend) via the repo root's
 * `npm run dev:all` so `npx playwright test` works standalone — set
 * reuseExistingServer so it also just attaches if you already have
 * `npm run dev:all` running locally instead of double-starting it.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev:all",
    cwd: "..",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
