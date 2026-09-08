import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app.js";
import { authCookie } from "./helpers/auth.js";

// Connecting/clearing collections between tests/disconnecting after the
// suite is handled globally by setupTestDb.ts (setupFilesAfterEnv) — no
// need to repeat that per file.

describe("Orders API", () => {
  it("rejects requests without a session cookie", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });

  describe("POST /api/orders", () => {
    it("creates an order with line items and a generated ORD- record number", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Cookie", authCookie())
        .send({
          customer: "Acme Corp",
          date: "2026-01-15",
          lineItems: [
            { product: "Widget A", qty: 3, price: 10 },
            { product: "Widget B", qty: 2, price: 25 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.number).toMatch(/^ORD-/);
      expect(res.body.status).toBe("Draft");
      expect(res.body.lineItems).toHaveLength(2);
    });

    it("rejects a request with no line items", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Cookie", authCookie())
        .send({ customer: "Acme Corp", date: "2026-01-15", lineItems: [] });

      expect(res.status).toBe(400);
    });

    it("rejects a line item with qty below the minimum", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Cookie", authCookie())
        .send({
          customer: "Acme Corp",
          date: "2026-01-15",
          lineItems: [{ product: "Widget A", qty: 0, price: 10 }],
        });
      expect(res.status).toBe(400);
    });

    it("500s on a missing required date — createOrder only validates lineItems itself, so a schema-level failure (date is required on Order) falls through to the centralized error handler rather than a controller-level 400", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Cookie", authCookie())
        .send({
          customer: "Acme Corp",
          lineItems: [{ product: "Widget A", qty: 1, price: 10 }],
        });
      expect(res.status).toBe(500);
    });

    it("assigns unique record numbers to orders created concurrently", async () => {
      const requests = Array.from({ length: 8 }, () =>
        request(app)
          .post("/api/orders")
          .set("Cookie", authCookie())
          .send({
            customer: "Concurrency Test",
            date: "2026-01-15",
            lineItems: [{ product: "Widget", qty: 1, price: 1 }],
          })
      );
      const results = await Promise.all(requests);
      for (const res of results) expect(res.status).toBe(201);

      const numbers = results.map((r) => r.body.number);
      expect(new Set(numbers).size).toBe(numbers.length);
    });
  });

  describe("GET /api/orders and /api/orders/:id", () => {
    it("lists created orders", async () => {
      await request(app)
        .post("/api/orders")
        .set("Cookie", authCookie())
        .send({ customer: "A", date: "2026-01-01", lineItems: [{ product: "X", qty: 1, price: 1 }] });

      const res = await request(app).get("/api/orders").set("Cookie", authCookie());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("returns 404 for an unknown order id", async () => {
      const res = await request(app)
        .get(`/api/orders/${new mongoose.Types.ObjectId()}`)
        .set("Cookie", authCookie());
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/orders/:id/status", () => {
    it("moves an order to a new valid status", async () => {
      const create = await request(app)
        .post("/api/orders")
        .set("Cookie", authCookie())
        .send({ customer: "A", date: "2026-01-01", lineItems: [{ product: "X", qty: 1, price: 1 }] });

      const res = await request(app)
        .patch(`/api/orders/${create.body._id}/status`)
        .set("Cookie", authCookie())
        .send({ status: "Confirmed" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Confirmed");
    });

    it("rejects an invalid status value", async () => {
      const create = await request(app)
        .post("/api/orders")
        .set("Cookie", authCookie())
        .send({ customer: "A", date: "2026-01-01", lineItems: [{ product: "X", qty: 1, price: 1 }] });

      const res = await request(app)
        .patch(`/api/orders/${create.body._id}/status`)
        .set("Cookie", authCookie())
        .send({ status: "Bogus" });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/orders/:id", () => {
    it("updates editable fields but ignores a client-supplied record number", async () => {
      const create = await request(app)
        .post("/api/orders")
        .set("Cookie", authCookie())
        .send({ customer: "A", date: "2026-01-01", lineItems: [{ product: "X", qty: 1, price: 1 }] });
      const originalNumber = create.body.number;

      const res = await request(app)
        .put(`/api/orders/${create.body._id}`)
        .set("Cookie", authCookie())
        .send({ number: "HACKED-001", customer: "B" });

      expect(res.status).toBe(200);
      expect(res.body.number).toBe(originalNumber);
      expect(res.body.customer).toBe("B");
    });
  });

  describe("DELETE /api/orders/:id", () => {
    it("deletes an order", async () => {
      const create = await request(app)
        .post("/api/orders")
        .set("Cookie", authCookie())
        .send({ customer: "A", date: "2026-01-01", lineItems: [{ product: "X", qty: 1, price: 1 }] });

      const del = await request(app).delete(`/api/orders/${create.body._id}`).set("Cookie", authCookie());
      expect(del.status).toBe(200);

      const get = await request(app).get(`/api/orders/${create.body._id}`).set("Cookie", authCookie());
      expect(get.status).toBe(404);
    });
  });
});

describe("Order Drafts API (email-parsed order review)", () => {
  it("rejects requests without a session cookie", async () => {
    const res = await request(app).get("/api/order-drafts");
    expect(res.status).toBe(401);
  });

  it("creates a draft, reflects an edit, and approves it into a real Confirmed Order", async () => {
    const draftRes = await request(app)
      .post("/api/order-drafts")
      .set("Cookie", authCookie())
      .send({
        customer: "Foothill Realty Partners",
        emailSubject: "Re: quote request",
        lineItems: [{ product: "Executive Desk", qty: 4, price: 15 }],
      });
    expect(draftRes.status).toBe(201);
    const draftId = draftRes.body._id;

    // A reviewer edits the draft before approving — approve() must read the
    // edited value, not the value the draft was originally created with.
    const editRes = await request(app)
      .put(`/api/order-drafts/${draftId}`)
      .set("Cookie", authCookie())
      .send({
        customer: "Foothill Realty Partners",
        emailSubject: "Re: quote request",
        lineItems: [{ product: "Executive Desk", qty: 5, price: 15 }],
      });
    expect(editRes.status).toBe(200);

    const approveRes = await request(app)
      .post(`/api/order-drafts/${draftId}/approve`)
      .set("Cookie", authCookie());

    expect(approveRes.status).toBe(201);
    expect(approveRes.body.status).toBe("Confirmed");
    expect(approveRes.body.number).toMatch(/^ORD-/);
    expect(approveRes.body.lineItems[0].qty).toBe(5);

    const getDraft = await request(app).get(`/api/order-drafts/${draftId}`).set("Cookie", authCookie());
    expect(getDraft.status).toBe(404);

    const listOrders = await request(app).get("/api/orders").set("Cookie", authCookie());
    expect(listOrders.body).toHaveLength(1);
  });

  it("rejects approving a draft that has no line items", async () => {
    const draftRes = await request(app)
      .post("/api/order-drafts")
      .set("Cookie", authCookie())
      .send({ customer: "Nobody", emailSubject: "Empty", lineItems: [] });
    expect(draftRes.status).toBe(201);

    const approveRes = await request(app)
      .post(`/api/order-drafts/${draftRes.body._id}/approve`)
      .set("Cookie", authCookie());
    expect(approveRes.status).toBe(400);
  });

  it("returns 404 approving an unknown draft id", async () => {
    const res = await request(app)
      .post(`/api/order-drafts/${new mongoose.Types.ObjectId()}/approve`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(404);
  });
});
