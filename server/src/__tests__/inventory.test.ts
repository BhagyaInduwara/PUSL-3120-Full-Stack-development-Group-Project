import request from "supertest";
import { app } from "../app.js";
import { authCookie } from "./helpers/auth.js";

const cookie = authCookie();

// Connecting/clearing collections between tests/disconnecting after the
// suite is handled globally by setupTestDb.ts (setupFilesAfterEnv) — no
// need to repeat that per file.

/* ------------------------------------------------------------------ */
/*  Helper: create a valid inventory item and return the response      */
/* ------------------------------------------------------------------ */
async function createItem(overrides: Record<string, unknown> = {}) {
  const payload = {
    sku: "SKU-001",
    name: "Test Widget",
    category: "Electronics",
    qty: 50,
    reorderPoint: 10,
    ...overrides,
  };
  const res = await request(app)
    .post("/api/inventory")
    .set("Cookie", cookie)
    .send(payload);
  return res;
}

/* ================================================================== */
/*  Suite: Inventory /api/inventory                                    */
/* ================================================================== */
describe("Inventory /api/inventory", () => {

  // INV-01: Create inventory item with valid fields
  it("INV-01: should create an inventory item with valid fields", async () => {
    const res = await createItem();

    expect(res.status).toBe(201);
    expect(res.body.inventoryItem).toBeDefined();
    expect(res.body.inventoryItem.sku).toBe("SKU-001");
    expect(res.body.inventoryItem.name).toBe("Test Widget");
    expect(res.body.inventoryItem.category).toBe("Electronics");
    expect(res.body.inventoryItem.qty).toBe(50);
    expect(res.body.inventoryItem.reorderPoint).toBe(10);
  });

  // INV-02: Reject duplicate SKU creation
  it("INV-02: should reject duplicate SKU creation", async () => {
    await createItem({ sku: "DUPE-SKU" });
    const res = await createItem({ sku: "DUPE-SKU" });

    expect(res.status).toBe(500);
  });

  // INV-03: Reject missing required fields (sku or name)
  it("INV-03: should reject creation when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .set("Cookie", cookie)
      .send({ qty: 10, reorderPoint: 5 }); // missing sku and name

    expect(res.status).toBe(500);
  });

  // INV-04: Reject negative quantity (qty < 0)
  it("INV-04: should reject creation with negative quantity", async () => {
    const res = await createItem({ qty: -5 });

    expect(res.status).toBe(500);
  });

  // INV-05: List all inventory items
  it("INV-05: should list all inventory items", async () => {
    await createItem({ sku: "SKU-A", name: "Item A" });
    await createItem({ sku: "SKU-B", name: "Item B" });

    const res = await request(app)
      .get("/api/inventory")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.inventory).toBeDefined();
    expect(Array.isArray(res.body.inventory)).toBe(true);
    expect(res.body.inventory.length).toBe(2);
  });

  // INV-06: Fetch inventory item by ID
  it("INV-06: should fetch an inventory item by valid ID", async () => {
    const created = await createItem();
    const itemId = created.body.inventoryItem._id;

    const res = await request(app)
      .get(`/api/inventory/${itemId}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.inventoryItem).toBeDefined();
    expect(res.body.inventoryItem._id).toBe(itemId);
  });

  // INV-07: Fetch non-existent item
  it("INV-07: should return 404 for non-existent inventory item", async () => {
    const fakeId = "000000000000000000000000";

    const res = await request(app)
      .get(`/api/inventory/${fakeId}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Inventory item not found");
  });

  // INV-08: Stock adjustment — increase / decrease quantity
  it("INV-08: should adjust stock quantity via PUT", async () => {
    const created = await createItem({ qty: 50 });
    const itemId = created.body.inventoryItem._id;

    // Increase stock to 80
    const resIncrease = await request(app)
      .put(`/api/inventory/${itemId}`)
      .set("Cookie", cookie)
      .send({ sku: "SKU-001", name: "Test Widget", qty: 80, reorderPoint: 10 });

    expect(resIncrease.status).toBe(200);
    expect(resIncrease.body.inventoryItem.qty).toBe(80);

    // Decrease stock to 20
    const resDecrease = await request(app)
      .put(`/api/inventory/${itemId}`)
      .set("Cookie", cookie)
      .send({ sku: "SKU-001", name: "Test Widget", qty: 20, reorderPoint: 10 });

    expect(resDecrease.status).toBe(200);
    expect(resDecrease.body.inventoryItem.qty).toBe(20);
  });

  // INV-09: Stock-out guard — reject update resulting in qty < 0
  it("INV-09: should reject stock update resulting in negative quantity", async () => {
    const created = await createItem({ qty: 5 });
    const itemId = created.body.inventoryItem._id;

    const res = await request(app)
      .put(`/api/inventory/${itemId}`)
      .set("Cookie", cookie)
      .send({ sku: "SKU-001", name: "Test Widget", qty: -1, reorderPoint: 10 });

    expect(res.status).toBe(500);
  });

  // INV-10: Low-stock threshold logic (qty <= reorderPoint)
  it("INV-10: should correctly represent low-stock state when qty <= reorderPoint", async () => {
    const res = await createItem({ qty: 3, reorderPoint: 5 });

    expect(res.status).toBe(201);
    const item = res.body.inventoryItem;
    expect(item.qty).toBe(3);
    expect(item.reorderPoint).toBe(5);
    expect(item.qty <= item.reorderPoint).toBe(true);
  });

  // INV-11: Delete inventory item
  it("INV-11: should delete an inventory item and return 404 on subsequent GET", async () => {
    const created = await createItem();
    const itemId = created.body.inventoryItem._id;

    const deleteRes = await request(app)
      .delete(`/api/inventory/${itemId}`)
      .set("Cookie", cookie);

    expect(deleteRes.status).toBe(200);

    // Verify it's gone
    const getRes = await request(app)
      .get(`/api/inventory/${itemId}`)
      .set("Cookie", cookie);

    expect(getRes.status).toBe(404);
  });

  // INV-12: Reject unauthenticated requests
  it("INV-12: should reject unauthenticated requests with 401", async () => {
    const res = await request(app)
      .get("/api/inventory");
    // No cookie set

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Not authenticated.");
  });
});
