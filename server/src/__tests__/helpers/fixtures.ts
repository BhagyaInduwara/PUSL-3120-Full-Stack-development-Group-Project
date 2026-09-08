import request from "supertest";
import type { Express } from "express";
import { authCookie } from "./auth.js";

/**
 * Creates an Order through the real POST /api/orders endpoint (not a direct
 * model insert) so every fixture used by Invoice/Shipment tests goes through
 * the same validation + record-numbering path a real caller would.
 */
export async function createTestOrder(app: Express, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/api/orders")
    .set("Cookie", authCookie())
    .send({
      customer: "Fixture Customer",
      date: "2026-01-01",
      lineItems: [{ product: "Fixture Widget", qty: 2, price: 25 }],
      ...overrides,
    });
  if (res.status !== 201) {
    throw new Error(`createTestOrder fixture failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

export async function createTestInvoice(app: Express, orderId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/api/invoices")
    .set("Cookie", authCookie())
    .send({ orderId, issueDate: "2026-01-01", dueDate: "2026-01-15", ...overrides });
  if (res.status !== 201) {
    throw new Error(`createTestInvoice fixture failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.invoice;
}
