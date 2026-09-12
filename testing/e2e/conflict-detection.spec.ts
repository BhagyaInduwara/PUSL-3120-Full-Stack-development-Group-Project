import { test, expect, type Page } from "@playwright/test";

/**
 * End-to-end test for optimistic concurrency control on Order edits (see
 * order.controller.ts's updateOrder): two independently logged-in clients
 * open the SAME order for editing at the same time, so both read the same
 * updatedAt. Client A saves first and succeeds. Client B's dialog was
 * already open before A's save, so it's still carrying that now-stale
 * updatedAt — its save must be rejected (409) with a clear message,
 * instead of silently overwriting A's change. The same mechanism protects
 * Invoice and Shipment edits (invoice.controller.ts / shipment.controller.ts)
 * — this test exercises the flagship Order flow, which is also the one
 * wired to a user-facing message (see sales/page.tsx's handleSaveOrder).
 */
const USERNAME = process.env.E2E_ADMIN_USERNAME ?? "admin";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin@123";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("e.g. jdoe").fill(USERNAME);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("Concurrency — conflicting edits are detected, not silently lost", () => {
  test("a stale second save is rejected with a clear message instead of overwriting the first client's change", async ({
    browser,
  }) => {
    test.setTimeout(60_000);

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const clientA = await contextA.newPage();
    const clientB = await contextB.newPage();

    await Promise.all([login(clientA), login(clientB)]);

    const customerName = `Conflict Test ${Date.now()}`;

    // Client A creates the order everyone will race to edit.
    await clientA.goto("/sales");
    await clientA.getByRole("button", { name: "New Order" }).click();
    await clientA.getByPlaceholder("e.g. Bluepeak Coworking").fill(customerName);
    await clientA.locator("select").first().selectOption({ index: 1 });
    const [createOrderResponse] = await Promise.all([
      clientA.waitForResponse((res) => res.url().includes("/api/orders") && res.request().method() === "POST"),
      clientA.getByRole("button", { name: "Create order" }).click(),
    ]);
    const order = (await createOrderResponse.json()) as { _id: string };

    // Client B loads the board fresh, independent of live-sync timing, so
    // both clients are guaranteed to see the same starting updatedAt.
    await clientB.goto("/sales");
    await clientB.waitForLoadState("networkidle");

    // Both clients open the SAME order for editing at "the same time" —
    // each dialog captures the order's current updatedAt as its own
    // concurrency token.
    const cardOnA = clientA.locator('[draggable="true"]').filter({ hasText: customerName });
    await cardOnA.click();
    await clientA.getByRole("button", { name: "Edit" }).click();

    const cardOnB = clientB.locator('[draggable="true"]').filter({ hasText: customerName });
    await cardOnB.click();
    await clientB.getByRole("button", { name: "Edit" }).click();

    // Client A saves first — succeeds.
    const customerFieldA = clientA.locator(`input[value="${customerName}"]`).first();
    await customerFieldA.fill("Client A's edit");
    await clientA.getByRole("button", { name: "Save changes" }).click();
    const [putA] = await Promise.all([
      clientA.waitForResponse((res) => res.url().includes(`/api/orders/${order._id}`) && res.request().method() === "PUT"),
      clientA.getByRole("button", { name: "Confirm & save" }).click(),
    ]);
    expect(putA.status()).toBe(200);

    // Client B still has the pre-A updatedAt from when its dialog opened.
    const customerFieldB = clientB.locator(`input[value="${customerName}"]`).first();
    await customerFieldB.fill("Client B's edit");
    await clientB.getByRole("button", { name: "Save changes" }).click();
    const [putB] = await Promise.all([
      clientB.waitForResponse((res) => res.url().includes(`/api/orders/${order._id}`) && res.request().method() === "PUT"),
      clientB.getByRole("button", { name: "Confirm & save" }).click(),
    ]);
    expect(putB.status()).toBe(409);

    // The conflict is surfaced to the user, not swallowed silently.
    await expect(clientB.getByText(/Someone else updated this order/i)).toBeVisible({ timeout: 10_000 });

    // The record reflects ONLY client A's save — B's write never applied,
    // not even partially.
    const check = await clientA.request.get(`http://localhost:4000/api/orders/${order._id}`, {
      headers: { Cookie: (await contextA.cookies()).map((c) => `${c.name}=${c.value}`).join("; ") },
    });
    const finalOrder = (await check.json()) as { customer: string };
    expect(finalOrder.customer).toBe("Client A's edit");

    // Clean up — this suite runs against the real Atlas cluster.
    await clientA.request.delete(`http://localhost:4000/api/orders/${order._id}`, {
      headers: { Cookie: (await contextA.cookies()).map((c) => `${c.name}=${c.value}`).join("; ") },
    });

    await contextA.close();
    await contextB.close();
  });
});
