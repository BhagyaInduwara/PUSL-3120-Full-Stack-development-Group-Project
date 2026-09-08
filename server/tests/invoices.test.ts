import request from "supertest";
import mongoose from "mongoose";
import { app } from "../src/app.js";
import { Order } from "../src/models/Order.js";
import { Invoice } from "../src/models/Invoice.js";
import { authCookie } from "./helpers/auth.js";
import { createTestOrder } from "./helpers/fixtures.js";

afterEach(async () => {
  await Invoice.deleteMany({});
  await Order.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Invoices API", () => {
  it("rejects requests without a session cookie", async () => {
    const res = await request(app).get("/api/invoices");
    expect(res.status).toBe(401);
  });

  describe("POST /api/invoices", () => {
    it("rejects a missing orderId", async () => {
      const res = await request(app).post("/api/invoices").set("Cookie", authCookie()).send({});
      expect(res.status).toBe(400);
    });

    it("rejects an orderId that isn't a valid ObjectId", async () => {
      const res = await request(app)
        .post("/api/invoices")
        .set("Cookie", authCookie())
        .send({ orderId: "not-an-id" });
      expect(res.status).toBe(400);
    });

    it("rejects an invalid status", async () => {
      const order = await createTestOrder(app);
      const res = await request(app)
        .post("/api/invoices")
        .set("Cookie", authCookie())
        .send({ orderId: order._id, status: "Bogus" });
      expect(res.status).toBe(400);
    });

    it("creates an invoice linked to a real order, with a generated INV- record number", async () => {
      const order = await createTestOrder(app);
      const res = await request(app)
        .post("/api/invoices")
        .set("Cookie", authCookie())
        .send({ orderId: order._id, issueDate: "2026-01-01", dueDate: "2026-01-15" });

      expect(res.status).toBe(201);
      expect(res.body.invoice.number).toMatch(/^INV-/);
      expect(res.body.invoice.status).toBe("Draft");
      expect(res.body.invoice.orderId).toBe(order._id);
      // createInvoice never populates — order should be absent, not merely empty.
      expect(res.body.invoice.order).toBeUndefined();
    });
  });

  describe("GET /api/invoices and /api/invoices/:id", () => {
    it("populates the linked order on both the list and the getById endpoints", async () => {
      const order = await createTestOrder(app, { customer: "Populate Check Co" });
      const created = await request(app)
        .post("/api/invoices")
        .set("Cookie", authCookie())
        .send({ orderId: order._id });

      const list = await request(app).get("/api/invoices").set("Cookie", authCookie());
      expect(list.status).toBe(200);
      const found = list.body.invoices.find((i: { id: string }) => i.id === created.body.invoice.id);
      expect(found.order).toBeDefined();
      expect(found.order.customer).toBe("Populate Check Co");

      const single = await request(app)
        .get(`/api/invoices/${created.body.invoice.id}`)
        .set("Cookie", authCookie());
      expect(single.status).toBe(200);
      expect(single.body.invoice.order).toBeDefined();
      expect(single.body.invoice.order.customer).toBe("Populate Check Co");
    });

    it("returns 404 for an unknown invoice id", async () => {
      const res = await request(app)
        .get(`/api/invoices/${new mongoose.Types.ObjectId()}`)
        .set("Cookie", authCookie());
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/invoices/:id", () => {
    it("updates issueDate/dueDate", async () => {
      const order = await createTestOrder(app);
      const created = await request(app)
        .post("/api/invoices")
        .set("Cookie", authCookie())
        .send({ orderId: order._id });

      const res = await request(app)
        .put(`/api/invoices/${created.body.invoice.id}`)
        .set("Cookie", authCookie())
        .send({ dueDate: "2026-03-01" });

      expect(res.status).toBe(200);
      expect(new Date(res.body.invoice.dueDate).toISOString().slice(0, 10)).toBe("2026-03-01");
    });

    it("rejects an invalid status on update", async () => {
      const order = await createTestOrder(app);
      const created = await request(app)
        .post("/api/invoices")
        .set("Cookie", authCookie())
        .send({ orderId: order._id });

      const res = await request(app)
        .put(`/api/invoices/${created.body.invoice.id}`)
        .set("Cookie", authCookie())
        .send({ status: "Bogus" });
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/invoices/:id/mark-paid", () => {
    it("marks an invoice as Paid", async () => {
      const order = await createTestOrder(app);
      const created = await request(app)
        .post("/api/invoices")
        .set("Cookie", authCookie())
        .send({ orderId: order._id });

      const res = await request(app)
        .patch(`/api/invoices/${created.body.invoice.id}/mark-paid`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(res.body.invoice.status).toBe("Paid");
    });

    it("returns 404 marking an unknown invoice paid", async () => {
      const res = await request(app)
        .patch(`/api/invoices/${new mongoose.Types.ObjectId()}/mark-paid`)
        .set("Cookie", authCookie());
      expect(res.status).toBe(404);
    });
  });
});
