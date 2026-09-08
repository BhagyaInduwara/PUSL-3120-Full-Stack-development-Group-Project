import request from "supertest";
import mongoose from "mongoose";
import { app } from "../src/app.js";
import { Order } from "../src/models/Order.js";
import { Invoice } from "../src/models/Invoice.js";
import { Shipment } from "../src/models/Shipment.js";
import { authCookie } from "./helpers/auth.js";
import { createTestOrder, createTestInvoice } from "./helpers/fixtures.js";

afterEach(async () => {
  await Shipment.deleteMany({});
  await Invoice.deleteMany({});
  await Order.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Shipments API", () => {
  it("rejects requests without a session cookie", async () => {
    const res = await request(app).get("/api/shipments");
    expect(res.status).toBe(401);
  });

  describe("POST /api/shipments", () => {
    it("rejects a missing orderId", async () => {
      const res = await request(app).post("/api/shipments").set("Cookie", authCookie()).send({});
      expect(res.status).toBe(400);
    });

    it("rejects an invalid invoiceId", async () => {
      const order = await createTestOrder(app);
      const res = await request(app)
        .post("/api/shipments")
        .set("Cookie", authCookie())
        .send({ orderId: order._id, invoiceId: "not-an-id" });
      expect(res.status).toBe(400);
    });

    it("rejects an invalid status", async () => {
      const order = await createTestOrder(app);
      const res = await request(app)
        .post("/api/shipments")
        .set("Cookie", authCookie())
        .send({ orderId: order._id, status: "Bogus" });
      expect(res.status).toBe(400);
    });

    it("creates a shipment with no invoice yet, with a generated SHP- number and a populated order", async () => {
      const order = await createTestOrder(app, { customer: "No Invoice Yet Co" });
      const res = await request(app)
        .post("/api/shipments")
        .set("Cookie", authCookie())
        .send({ orderId: order._id, date: "2026-02-01" });

      expect(res.status).toBe(201);
      expect(res.body.shipment.number).toMatch(/^SHP-/);
      expect(res.body.shipment.status).toBe("Draft");
      expect(res.body.shipment.invoiceId).toBeNull();
      expect(res.body.shipment.invoice).toBeUndefined();
      // create() always populates orderId (unlike Invoice's create, which doesn't populate at all).
      expect(res.body.shipment.order).toBeDefined();
      expect(res.body.shipment.order.customer).toBe("No Invoice Yet Co");
    });

    it("links a shipment to both an order and an invoice", async () => {
      const order = await createTestOrder(app);
      const invoice = await createTestInvoice(app, order._id);

      const res = await request(app)
        .post("/api/shipments")
        .set("Cookie", authCookie())
        .send({ orderId: order._id, invoiceId: invoice.id });

      expect(res.status).toBe(201);
      expect(res.body.shipment.invoiceId).toBe(invoice.id);
      expect(res.body.shipment.invoice).toEqual({ id: invoice.id, number: invoice.number });
    });
  });

  describe("GET /api/shipments and /api/shipments/:id", () => {
    it("populates order and invoice on BOTH list and getById — unlike Invoice, whose create/update don't populate", async () => {
      const order = await createTestOrder(app);
      const invoice = await createTestInvoice(app, order._id);
      const created = await request(app)
        .post("/api/shipments")
        .set("Cookie", authCookie())
        .send({ orderId: order._id, invoiceId: invoice.id });

      const single = await request(app)
        .get(`/api/shipments/${created.body.shipment.id}`)
        .set("Cookie", authCookie());
      expect(single.status).toBe(200);
      expect(single.body.shipment.order).toBeDefined();
      expect(single.body.shipment.invoice).toBeDefined();

      const list = await request(app).get("/api/shipments").set("Cookie", authCookie());
      expect(list.status).toBe(200);
      const found = list.body.shipments.find((s: { id: string }) => s.id === created.body.shipment.id);
      expect(found.order).toBeDefined();
      expect(found.invoice).toBeDefined();
    });

    it("returns 404 for an unknown shipment id", async () => {
      const res = await request(app)
        .get(`/api/shipments/${new mongoose.Types.ObjectId()}`)
        .set("Cookie", authCookie());
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/shipments/:id", () => {
    it("rejects an invalid status", async () => {
      const order = await createTestOrder(app);
      const created = await request(app)
        .post("/api/shipments")
        .set("Cookie", authCookie())
        .send({ orderId: order._id });

      const res = await request(app)
        .put(`/api/shipments/${created.body.shipment.id}`)
        .set("Cookie", authCookie())
        .send({ status: "Bogus" });
      expect(res.status).toBe(400);
    });

    it("attaches an invoice after the fact via PUT", async () => {
      const order = await createTestOrder(app);
      const created = await request(app)
        .post("/api/shipments")
        .set("Cookie", authCookie())
        .send({ orderId: order._id });
      expect(created.body.shipment.invoiceId).toBeNull();

      const invoice = await createTestInvoice(app, order._id);
      const res = await request(app)
        .put(`/api/shipments/${created.body.shipment.id}`)
        .set("Cookie", authCookie())
        .send({ invoiceId: invoice.id });

      expect(res.status).toBe(200);
      expect(res.body.shipment.invoiceId).toBe(invoice.id);
    });
  });

  describe("PATCH /api/shipments/:id/dispatch and /deliver", () => {
    it("moves a shipment from Draft through Dispatched to Delivered", async () => {
      const order = await createTestOrder(app);
      const created = await request(app)
        .post("/api/shipments")
        .set("Cookie", authCookie())
        .send({ orderId: order._id });

      const dispatch = await request(app)
        .patch(`/api/shipments/${created.body.shipment.id}/dispatch`)
        .set("Cookie", authCookie());
      expect(dispatch.status).toBe(200);
      expect(dispatch.body.shipment.status).toBe("Dispatched");

      const deliver = await request(app)
        .patch(`/api/shipments/${created.body.shipment.id}/deliver`)
        .set("Cookie", authCookie());
      expect(deliver.status).toBe(200);
      expect(deliver.body.shipment.status).toBe("Delivered");
    });

    it("returns 404 dispatching an unknown shipment", async () => {
      const res = await request(app)
        .patch(`/api/shipments/${new mongoose.Types.ObjectId()}/dispatch`)
        .set("Cookie", authCookie());
      expect(res.status).toBe(404);
    });

    it("returns 404 delivering an unknown shipment", async () => {
      const res = await request(app)
        .patch(`/api/shipments/${new mongoose.Types.ObjectId()}/deliver`)
        .set("Cookie", authCookie());
      expect(res.status).toBe(404);
    });
  });
});
