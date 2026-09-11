import { test, expect, type Page } from "@playwright/test";

/**
 * End-to-end test: the full order-to-delivery flow, exercised through the
 * real UI on one browser context ("A") while a second, independently
 * logged-in browser context ("B") watches the same screens update live —
 * proving the Socket.io real-time layer (server broadcasts + useLiveEvent)
 * actually works end to end, not just that each REST endpoint responds.
 *
 * Every write happens through real UI interactions (forms, drag-and-drop,
 * buttons) on client A; every assertion about "did it sync" reads client
 * B's DOM without ever reloading or refetching it — a stale board would
 * fail these checks even though the app "works" from a single-client
 * point of view.
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

/** Navigates both clients to the same screen and gives their fresh Socket.io connections (see SocketProvider) a moment to finish the handshake before any test action fires an event neither has connected in time to receive. */
async function gotoBoth(clientA: Page, clientB: Page, path: string) {
  await Promise.all([clientA.goto(path), clientB.goto(path)]);
  await Promise.all([clientA.waitForLoadState("networkidle"), clientB.waitForLoadState("networkidle")]);
}

test.describe("Full flow — live-synced across two clients", () => {
  test("order -> confirm -> invoice -> ship -> production job, all visible on a second client in real time", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const clientA = await contextA.newPage();
    const clientB = await contextB.newPage();

    await Promise.all([login(clientA), login(clientB)]);

    const customerName = `E2E LiveSync ${Date.now()}`;

    // --- Sales: create an order on A, see it appear live on B ---
    await gotoBoth(clientA, clientB, "/sales");

    await clientA.getByRole("button", { name: "New Order" }).click();
    await clientA.getByPlaceholder("e.g. Bluepeak Coworking").fill(customerName);
    // The default line item's product/price populate once /api/products
    // resolves — wait for that instead of racing it.
    await expect(clientA.getByRole("button", { name: "Create order" })).toBeEnabled({ timeout: 10_000 });

    const [createOrderResponse] = await Promise.all([
      clientA.waitForResponse((res) => res.url().includes("/api/orders") && res.request().method() === "POST"),
      clientA.getByRole("button", { name: "Create order" }).click(),
    ]);
    const order = (await createOrderResponse.json()) as { _id: string; number: string; customer: string };

    const cardOnB = clientB.locator('[draggable="true"]').filter({ hasText: customerName });
    await expect(cardOnB).toBeVisible({ timeout: 10_000 });

    // --- Confirm the order via drag-and-drop on A, see the status flip live on B ---
    const cardOnA = clientA.locator('[draggable="true"]').filter({ hasText: customerName });
    const confirmedColumnOnA = clientA.locator("span.text-xs.font-semibold.tracking-wide", { hasText: "Confirmed" });
    await cardOnA.dragTo(confirmedColumnOnA);
    await clientA.getByRole("button", { name: "Save" }).click();

    await expect(cardOnB.getByText("Confirmed", { exact: true })).toBeVisible({ timeout: 10_000 });

    // --- Invoicing: create an invoice against that order on A, see it live on B ---
    await gotoBoth(clientA, clientB, "/invoicing");

    await clientA.getByRole("button", { name: "New Invoice" }).click();
    await clientA.locator("select").first().selectOption({ value: order._id });

    const [createInvoiceResponse] = await Promise.all([
      clientA.waitForResponse((res) => res.url().includes("/api/invoices") && res.request().method() === "POST"),
      clientA.getByRole("button", { name: "Create invoice" }).click(),
    ]);
    const { invoice } = (await createInvoiceResponse.json()) as { invoice: { id: string; number: string } };

    await expect(clientB.getByText(invoice.number)).toBeVisible({ timeout: 10_000 });

    // --- Shipments: create, dispatch, and deliver a shipment on A, watch each transition live on B ---
    await gotoBoth(clientA, clientB, "/shipments");

    await clientA.getByRole("button", { name: "New Shipment" }).click();
    await clientA.locator("select").first().selectOption({ value: order._id });

    const [createShipmentResponse] = await Promise.all([
      clientA.waitForResponse((res) => res.url().includes("/api/shipments") && res.request().method() === "POST"),
      clientA.getByRole("button", { name: "Create shipment" }).click(),
    ]);
    const { shipment } = (await createShipmentResponse.json()) as { shipment: { id: string; number: string } };

    const shipmentRowOnB = clientB.locator("tr", { hasText: shipment.number });
    await expect(shipmentRowOnB).toBeVisible({ timeout: 10_000 });

    await clientA.getByText(shipment.number).click();
    await clientA.getByRole("button", { name: "Dispatch Shipment" }).click();
    await expect(shipmentRowOnB.getByText("Dispatched", { exact: true })).toBeVisible({ timeout: 10_000 });

    // Dispatching closes the detail dialog (see shipments/page.tsx's handleDispatch), so reopen it.
    await clientA.getByText(shipment.number).click();
    await clientA.getByRole("button", { name: "Mark Delivered" }).click();
    await expect(shipmentRowOnB.getByText("Delivered", { exact: true })).toBeVisible({ timeout: 10_000 });

    // --- Production: schedule a job linked to the same order on A, see it live on B ---
    await gotoBoth(clientA, clientB, "/production");

    await clientA.getByRole("button", { name: "Create New Job" }).click();
    // First select is "Link to Sales Order", second is "Product" (see NewJobModal —
    // neither <label> is htmlFor-associated, so ordinal position is the stable handle).
    await clientA.locator("select").nth(0).selectOption({ value: order.number });
    await clientA.locator('input[type="date"]').fill("2026-12-01");

    const [createJobResponse] = await Promise.all([
      clientA.waitForResponse((res) => res.url().includes("/api/production-jobs") && res.request().method() === "POST"),
      clientA.getByRole("button", { name: "Schedule Job" }).click(),
    ]);
    const { productionJob } = (await createJobResponse.json()) as { productionJob: { number: string } };

    // Scoped to this specific card (not just getByText(customerName)) because
    // production/page.tsx's toProductionJob() fills in orderNumber/customer
    // for *other*, older jobs that share this product but predate that field
    // being stored — a real, documented fallback (see its own comment), not
    // a bug — so an older card can legitimately show the same customer text.
    const jobCardOnB = clientB.locator('[draggable="true"]').filter({ hasText: productionJob.number });
    await expect(jobCardOnB).toBeVisible({ timeout: 10_000 });
    await expect(jobCardOnB.getByText(customerName)).toBeVisible({ timeout: 10_000 });

    await contextA.close();
    await contextB.close();
  });
});
