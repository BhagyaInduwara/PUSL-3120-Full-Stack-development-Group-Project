import { test, expect } from "@playwright/test";

/**
 * Login smoke test — the one E2E flow this milestone's task calls out by
 * name. Uses the seeded admin account (`npm run seed` in /server) since
 * that's the one account guaranteed to exist in a fresh dev environment.
 * Credentials are read from env vars so CI (or a teammate's seed data) can
 * override them without editing this file.
 */
const USERNAME = process.env.E2E_ADMIN_USERNAME ?? "admin";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin@123";

test.describe("Login", () => {
  test("valid credentials redirect to the dashboard and set the session cookie", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("e.g. jdoe").fill(USERNAME);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === "flowerp_token");
    expect(sessionCookie, "flowerp_token session cookie should be set after login").toBeTruthy();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.value).toBeTruthy();
  });

  test("wrong password stays on the login page with an error and no session cookie", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("e.g. jdoe").fill(USERNAME);
    await page.locator('input[type="password"]').fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Invalid username or password.")).toBeVisible();

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "flowerp_token")).toBeUndefined();
  });
});
