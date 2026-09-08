import request from "supertest";
import { app } from "../app.js";
import { Order } from "../models/Order.js";
import { Shipment } from "../models/Shipment.js";

/**
 * Regression test for the bug documented in docs/bug-report.md: the
 * Next.js domain class (src/domain/Shipment.ts) documents "Delivered
 * shipments are finalized and cannot be modified" and enforces it in the
 * UI via `canEdit`, but PUT /api/shipments/:id never checked that
 * server-side — a direct API call could silently edit a shipment that's
 * already marked Delivered, undermining it as a finalized delivery record.
 */

/** Pulls the flowerp_token cookie header off a response so it can be replayed on the next request. */
function sessionCookie(res: request.Response): string {
  const setCookie = res.headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const token = cookies.find((c: string) => c.startsWith("flowerp_token="));
  if (!token) throw new Error("Response did not set a flowerp_token cookie.");
  return token;
}

async function authenticatedCookie(): Promise<string> {
  const res = await request(app).post("/api/auth/register").send({ username: "shiptester", password: "password123" });
  return sessionCookie(res);
}

describe("PUT /api/shipments/:id on a Delivered shipment", () => {
  it("is rejected (409) and leaves the shipment's date/status unchanged", async () => {
    const cookie = await authenticatedCookie();

    const order = await Order.create({
      number: "ORD-TEST-001",
      customer: "Regression Test Co.",
      lineItems: [{ product: "Test Widget", qty: 1, price: 10 }],
      status: "Shipped",
      date: new Date(),
    });

    const delivered = await Shipment.create({
      number: "SHP-TEST-001",
      orderId: order._id,
      invoiceId: null,
      status: "Delivered",
      date: new Date("2026-01-01"),
    });

    const res = await request(app)
      .put(`/api/shipments/${delivered._id}`)
      .set("Cookie", cookie)
      .send({ date: "2099-12-31", status: "Draft" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/delivered/i);

    const stillInDb = await Shipment.findById(delivered._id);
    expect(stillInDb!.status).toBe("Delivered");
    expect(stillInDb!.date?.toISOString()).toBe(new Date("2026-01-01").toISOString());
  });

  it("still allows updating a non-Delivered (e.g. Packed) shipment", async () => {
    const cookie = await authenticatedCookie();

    const order = await Order.create({
      number: "ORD-TEST-002",
      customer: "Regression Test Co.",
      lineItems: [{ product: "Test Widget", qty: 1, price: 10 }],
      status: "Shipped",
      date: new Date(),
    });

    const packed = await Shipment.create({
      number: "SHP-TEST-002",
      orderId: order._id,
      invoiceId: null,
      status: "Packed",
      date: new Date("2026-01-01"),
    });

    const res = await request(app)
      .put(`/api/shipments/${packed._id}`)
      .set("Cookie", cookie)
      .send({ date: "2026-02-01" });

    expect(res.status).toBe(200);
  });
});
