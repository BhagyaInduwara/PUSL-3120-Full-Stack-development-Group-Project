import request from "supertest";
import { app } from "../app.js";
import { authCookie } from "./helpers/auth.js";
import { setIO, emitEvent, getIO } from "../utils/socket.js";
import { Order } from "../models/Order.js";
import { IncomingOrderDraft } from "../models/IncomingOrderDraft.js";
import { Invoice } from "../models/Invoice.js";

describe("Real-Time Socket Events — Sales Pipeline (Chunk 4 Verification)", () => {
  const mockEmit = jest.fn();

  beforeEach(() => {
    mockEmit.mockClear();
    setIO({ emit: mockEmit });
  });

  afterAll(() => {
    setIO(null);
  });

  describe("Socket Broadcast Safety & Non-Blocking Guarantee", () => {
    it("does not throw when Socket.io instance is null/uninitialized", () => {
      setIO(null);
      expect(getIO()).toBeNull();
      expect(() => {
        emitEvent("test:event", { foo: "bar" });
      }).not.toThrow();
    });

    it("catches and suppresses any emission runtime errors without failing the caller", () => {
      const faultyEmitter = {
        emit: jest.fn(() => {
          throw new Error("Socket disconnected unexpectedly");
        }),
      };
      setIO(faultyEmitter);

      expect(() => {
        emitEvent("order:created", { id: "123" });
      }).not.toThrow();
      expect(faultyEmitter.emit).toHaveBeenCalledWith("order:created", { id: "123" });
    });
  });

  describe("Order Events (order.controller.ts)", () => {
    it("emits 'order:created' with full order payload on order creation", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Cookie", authCookie())
        .send({
          customer: "Acme Logistics",
          date: new Date().toISOString(),
          lineItems: [{ product: "Orchids", qty: 5, price: 20 }],
        });

      expect(res.status).toBe(201);
      expect(mockEmit).toHaveBeenCalledWith("order:created", expect.objectContaining({
        customer: "Acme Logistics",
        number: expect.stringMatching(/^ORD-/),
      }));
    });

    it("emits 'order:updated' on PATCH status transition", async () => {
      const order = await Order.create({
        number: "ORD-TEST-001",
        customer: "Acme Logistics",
        date: new Date(),
        status: "Draft",
        lineItems: [{ product: "Orchids", qty: 2, price: 10 }],
      });

      const res = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set("Cookie", authCookie())
        .send({ status: "Confirmed" });

      expect(res.status).toBe(200);
      expect(mockEmit).toHaveBeenCalledWith("order:updated", expect.objectContaining({
        status: "Confirmed",
      }));
    });

    it("emits 'order:deleted' on DELETE", async () => {
      const order = await Order.create({
        number: "ORD-TEST-002",
        customer: "Acme Logistics",
        date: new Date(),
        status: "Draft",
        lineItems: [{ product: "Orchids", qty: 1, price: 15 }],
      });

      const res = await request(app)
        .delete(`/api/orders/${order._id}`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(mockEmit).toHaveBeenCalledWith("order:deleted", { id: order._id.toString() });
    });
  });

  describe("Order Draft Events (orderDraft.controller.ts)", () => {
    it("emits 'order_draft:created' on draft creation", async () => {
      const res = await request(app)
        .post("/api/order-drafts")
        .set("Cookie", authCookie())
        .send({
          customer: "Bloom Express",
          source: "Email",
          notes: "Urgent shipment",
          lineItems: [{ product: "Roses", qty: 10, price: 5 }],
        });

      expect(res.status).toBe(201);
      expect(mockEmit).toHaveBeenCalledWith("order_draft:created", expect.objectContaining({
        customer: "Bloom Express",
      }));
    });

    it("emits 'order_draft:approved' and 'order:created' on draft approval", async () => {
      const draft = await IncomingOrderDraft.create({
        customer: "Bloom Express",
        source: "Email",
        lineItems: [{ product: "Roses", qty: 10, price: 5 }],
      });

      const res = await request(app)
        .post(`/api/order-drafts/${draft._id}/approve`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(201);
      expect(mockEmit).toHaveBeenCalledWith(
        "order_draft:approved",
        expect.objectContaining({ draftId: draft._id.toString() })
      );
      expect(mockEmit).toHaveBeenCalledWith("order:created", expect.objectContaining({
        customer: "Bloom Express",
        status: "Confirmed",
      }));
    });
  });

  describe("Invoice Events (invoice.controller.ts)", () => {
    it("emits 'invoice:created' with sanitized public payload", async () => {
      const order = await Order.create({
        number: "ORD-TEST-003",
        customer: "Garden Floral",
        date: new Date(),
        status: "Confirmed",
        lineItems: [{ product: "Tulips", qty: 4, price: 8 }],
      });

      const res = await request(app)
        .post("/api/invoices")
        .set("Cookie", authCookie())
        .send({
          orderId: order._id.toString(),
          status: "Draft",
        });

      expect(res.status).toBe(201);
      expect(mockEmit).toHaveBeenCalledWith("invoice:created", expect.objectContaining({
        id: expect.any(String),
        orderId: order._id.toString(),
        status: "Draft",
      }));
      expect(mockEmit).toHaveBeenCalledWith("invoice:changed", expect.objectContaining({
        orderId: order._id.toString(),
      }));
    });

    it("emits 'invoice:paid' when marked as paid", async () => {
      const order = await Order.create({
        number: "ORD-TEST-004",
        customer: "Garden Floral",
        date: new Date(),
        status: "Confirmed",
        lineItems: [{ product: "Tulips", qty: 4, price: 8 }],
      });

      const invoice = await Invoice.create({
        number: "INV-TEST-001",
        orderId: order._id,
        status: "Sent",
      });

      const res = await request(app)
        .patch(`/api/invoices/${invoice._id}/mark-paid`)
        .set("Cookie", authCookie());

      expect(res.status).toBe(200);
      expect(mockEmit).toHaveBeenCalledWith("invoice:paid", expect.objectContaining({
        id: invoice._id.toString(),
        status: "Paid",
      }));
      expect(mockEmit).toHaveBeenCalledWith("invoice:changed", expect.objectContaining({
        id: invoice._id.toString(),
        status: "Paid",
      }));
    });
  });
});
