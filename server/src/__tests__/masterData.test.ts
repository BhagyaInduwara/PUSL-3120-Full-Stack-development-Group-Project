import request from "supertest";
import { app } from "../app.js";
import { authCookie } from "./helpers/auth.js";

const cookie = authCookie();

// Connecting/clearing collections between tests/disconnecting after the
// suite is handled globally by setupTestDb.ts (setupFilesAfterEnv) — no
// need to repeat that per file.

/* ================================================================== */
/*  Suite: Products /api/products                                      */
/* ================================================================== */
describe("Products /api/products", () => {

  // MD-PRD-01: Create valid product
  it("MD-PRD-01: should create a product with uppercase SKU and numeric price", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Cookie", cookie)
      .send({ sku: "widget-a", name: "Widget Alpha", price: 29.99, category: "Parts" });

    expect(res.status).toBe(201);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.sku).toBe("WIDGET-A");
    expect(res.body.product.name).toBe("Widget Alpha");
    expect(res.body.product.price).toBe(29.99);
  });

  // MD-PRD-02: Duplicate SKU
  it("MD-PRD-02: should reject duplicate SKU with 409", async () => {
    await request(app)
      .post("/api/products")
      .set("Cookie", cookie)
      .send({ sku: "DUP-SKU", name: "First Product", price: 10 });

    const res = await request(app)
      .post("/api/products")
      .set("Cookie", cookie)
      .send({ sku: "dup-sku", name: "Second Product", price: 20 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("That SKU is already in use.");
  });

  // MD-PRD-03: Missing name or SKU
  it("MD-PRD-03: should reject creation with missing SKU", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Cookie", cookie)
      .send({ name: "No SKU Product", price: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("SKU is required.");
  });

  // MD-PRD-04: Invalid price (price < 0)
  it("MD-PRD-04: should reject creation with negative price", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Cookie", cookie)
      .send({ sku: "NEG-PRICE", name: "Bad Price Item", price: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Price is required and must be a number >= 0.");
  });

  // MD-PRD-05: Update product details
  it("MD-PRD-05: should update product details via PUT", async () => {
    const created = await request(app)
      .post("/api/products")
      .set("Cookie", cookie)
      .send({ sku: "UPD-001", name: "Original", price: 10 });

    const productId = created.body.product.id;

    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set("Cookie", cookie)
      .send({ name: "Updated Name", price: 49.99 });

    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe("Updated Name");
    expect(res.body.product.price).toBe(49.99);
  });

  // MD-PRD-06: Conflict with another product's SKU on update
  it("MD-PRD-06: should reject PUT that conflicts with another product's SKU", async () => {
    await request(app)
      .post("/api/products")
      .set("Cookie", cookie)
      .send({ sku: "AAA", name: "Product A", price: 10 });

    const productB = await request(app)
      .post("/api/products")
      .set("Cookie", cookie)
      .send({ sku: "BBB", name: "Product B", price: 20 });

    const productBId = productB.body.product.id;

    const res = await request(app)
      .put(`/api/products/${productBId}`)
      .set("Cookie", cookie)
      .send({ sku: "AAA" }); // conflicts with Product A

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("That SKU is already in use.");
  });

  // MD-PRD-07: Delete product
  it("MD-PRD-07: should delete a product and return 404 on subsequent GET", async () => {
    const created = await request(app)
      .post("/api/products")
      .set("Cookie", cookie)
      .send({ sku: "DEL-001", name: "To Delete", price: 5 });

    const productId = created.body.product.id;

    const deleteRes = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Cookie", cookie);

    expect(deleteRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/products/${productId}`)
      .set("Cookie", cookie);

    expect(getRes.status).toBe(404);
  });
});

/* ================================================================== */
/*  Suite: Customers /api/customers                                    */
/* ================================================================== */
describe("Customers /api/customers", () => {

  // MD-CUST-01: Create valid customer
  it("MD-CUST-01: should create a customer with public representation", async () => {
    const res = await request(app)
      .post("/api/customers")
      .set("Cookie", cookie)
      .send({ name: "John Doe", contact: "0771234567", email: "john@example.com", city: "Colombo" });

    expect(res.status).toBe(201);
    expect(res.body.customer).toBeDefined();
    expect(res.body.customer.name).toBe("John Doe");
    expect(res.body.customer.contact).toBe("0771234567");
    expect(res.body.customer.email).toBe("john@example.com");
    expect(res.body.customer.city).toBe("Colombo");
    expect(res.body.customer.id).toBeDefined();
  });

  // MD-CUST-02: Missing/blank name
  it("MD-CUST-02: should reject creation with blank name", async () => {
    const res = await request(app)
      .post("/api/customers")
      .set("Cookie", cookie)
      .send({ name: "   ", email: "blank@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name is required.");
  });

  // MD-CUST-03: List all customers sorted chronologically
  it("MD-CUST-03: should list all customers sorted by createdAt", async () => {
    await request(app)
      .post("/api/customers")
      .set("Cookie", cookie)
      .send({ name: "Alice" });

    await request(app)
      .post("/api/customers")
      .set("Cookie", cookie)
      .send({ name: "Bob" });

    const res = await request(app)
      .get("/api/customers")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.customers).toBeDefined();
    expect(res.body.customers.length).toBe(2);
    expect(res.body.customers[0].name).toBe("Alice");
    expect(res.body.customers[1].name).toBe("Bob");
  });

  // MD-CUST-04: Update contact & city
  it("MD-CUST-04: should update customer contact and city", async () => {
    const created = await request(app)
      .post("/api/customers")
      .set("Cookie", cookie)
      .send({ name: "Jane", contact: "old-contact", city: "Kandy" });

    const customerId = created.body.customer.id;

    const res = await request(app)
      .put(`/api/customers/${customerId}`)
      .set("Cookie", cookie)
      .send({ contact: "new-contact", city: "Galle" });

    expect(res.status).toBe(200);
    expect(res.body.customer.contact).toBe("new-contact");
    expect(res.body.customer.city).toBe("Galle");
    expect(res.body.customer.name).toBe("Jane"); // unchanged
  });

  // MD-CUST-05: Delete customer
  it("MD-CUST-05: should delete a customer with 204 and return 404 on subsequent GET", async () => {
    const created = await request(app)
      .post("/api/customers")
      .set("Cookie", cookie)
      .send({ name: "To Delete" });

    const customerId = created.body.customer.id;

    const deleteRes = await request(app)
      .delete(`/api/customers/${customerId}`)
      .set("Cookie", cookie);

    expect(deleteRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/customers/${customerId}`)
      .set("Cookie", cookie);

    expect(getRes.status).toBe(404);
  });
});

/* ================================================================== */
/*  Suite: Suppliers /api/suppliers                                     */
/* ================================================================== */
describe("Suppliers /api/suppliers", () => {

  // MD-SUPP-01: Create valid supplier
  it("MD-SUPP-01: should create a supplier with public representation", async () => {
    const res = await request(app)
      .post("/api/suppliers")
      .set("Cookie", cookie)
      .send({ name: "Acme Supplies", category: "Electronics", contact: "0779876543", leadTime: "5 days" });

    expect(res.status).toBe(201);
    expect(res.body.supplier).toBeDefined();
    expect(res.body.supplier.name).toBe("Acme Supplies");
    expect(res.body.supplier.category).toBe("Electronics");
    expect(res.body.supplier.contact).toBe("0779876543");
    expect(res.body.supplier.leadTime).toBe("5 days");
    expect(res.body.supplier.id).toBeDefined();
  });

  // MD-SUPP-02: Missing/blank name
  it("MD-SUPP-02: should reject creation with blank name", async () => {
    const res = await request(app)
      .post("/api/suppliers")
      .set("Cookie", cookie)
      .send({ name: "", category: "Raw Materials" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name is required.");
  });

  // MD-SUPP-03: Update lead time
  it("MD-SUPP-03: should update supplier lead time", async () => {
    const created = await request(app)
      .post("/api/suppliers")
      .set("Cookie", cookie)
      .send({ name: "Fast Supplier", leadTime: "3 days" });

    const supplierId = created.body.supplier.id;

    const res = await request(app)
      .put(`/api/suppliers/${supplierId}`)
      .set("Cookie", cookie)
      .send({ leadTime: "1 day" });

    expect(res.status).toBe(200);
    expect(res.body.supplier.leadTime).toBe("1 day");
    expect(res.body.supplier.name).toBe("Fast Supplier"); // unchanged
  });

  // MD-SUPP-04: Delete supplier
  it("MD-SUPP-04: should delete a supplier with 204 and return 404 on subsequent GET", async () => {
    const created = await request(app)
      .post("/api/suppliers")
      .set("Cookie", cookie)
      .send({ name: "To Delete Supplier" });

    const supplierId = created.body.supplier.id;

    const deleteRes = await request(app)
      .delete(`/api/suppliers/${supplierId}`)
      .set("Cookie", cookie);

    expect(deleteRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/suppliers/${supplierId}`)
      .set("Cookie", cookie);

    expect(getRes.status).toBe(404);
  });
});
