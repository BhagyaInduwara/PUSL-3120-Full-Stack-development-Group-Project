import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import request from "supertest";
import { app } from "../app.js";
import { initSocketServer } from "../realtime/socket.js";
import { authCookie } from "./helpers/auth.js";

let httpServer: HttpServer;
let baseUrl: string;

beforeAll(async () => {
  httpServer = createServer(app);
  initSocketServer(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

/** Always disconnect the client at the end of each test, pass or fail, so one test's open socket can't bleed into the next. */
function connect(extraHeaders?: Record<string, string>): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, { extraHeaders, reconnection: false, forceNew: true });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(err));
  });
}

describe("Socket.io — authenticated handshake", () => {
  it("rejects a connection with no session cookie", async () => {
    await expect(connect()).rejects.toThrow("Not authenticated.");
  });

  it("rejects a connection with an invalid/garbage cookie", async () => {
    await expect(connect({ Cookie: "flowerp_token=not-a-real-jwt" })).rejects.toThrow("Not authenticated.");
  });

  it("accepts a connection with a valid session cookie", async () => {
    const socket = await connect({ Cookie: authCookie() });
    expect(socket.connected).toBe(true);
    socket.disconnect();
  });
});

/**
 * Live-sync Sales & Order Board: order.controller.ts / orderDraft.controller.ts
 * broadcast "order:changed" (via realtime/socket.ts's emitEvent) so every
 * connected client's board updates without a manual refresh. These tests
 * drive the change through the real REST endpoints (not by calling
 * emitEvent directly) so a broken wire-up between a controller and the
 * socket layer would actually fail a test, not just look right on paper.
 */
describe("Socket.io — order:changed broadcasts", () => {
  function nextOrderChanged(socket: ClientSocket): Promise<{ order: { number: string; status: string } }> {
    return new Promise((resolve) => socket.once("order:changed", resolve));
  }

  it("broadcasts order:changed when an order is created", async () => {
    const socket = await connect({ Cookie: authCookie() });
    const received = nextOrderChanged(socket);

    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", authCookie())
      .send({ customer: "Realtime Co", date: "2026-01-01", lineItems: [{ product: "Widget", qty: 1, price: 10 }] });
    expect(res.status).toBe(201);

    const payload = await received;
    expect(payload.order.number).toBe(res.body.number);
    socket.disconnect();
  });

  it("broadcasts order:changed when an order's status moves (Kanban drag)", async () => {
    const create = await request(app)
      .post("/api/orders")
      .set("Cookie", authCookie())
      .send({ customer: "Realtime Co", date: "2026-01-01", lineItems: [{ product: "Widget", qty: 1, price: 10 }] });

    const socket = await connect({ Cookie: authCookie() });
    const received = nextOrderChanged(socket);

    const res = await request(app)
      .patch(`/api/orders/${create.body._id}/status`)
      .set("Cookie", authCookie())
      .send({ status: "Confirmed" });
    expect(res.status).toBe(200);

    const payload = await received;
    expect(payload.order.status).toBe("Confirmed");
    socket.disconnect();
  });

  it("broadcasts order:changed when a draft is approved into a Confirmed order", async () => {
    const draft = await request(app)
      .post("/api/order-drafts")
      .set("Cookie", authCookie())
      .send({ customer: "Draft Co", emailSubject: "Re: quote", lineItems: [{ product: "Widget", qty: 2, price: 5 }] });

    const socket = await connect({ Cookie: authCookie() });
    const received = nextOrderChanged(socket);

    const res = await request(app)
      .post(`/api/order-drafts/${draft.body._id}/approve`)
      .set("Cookie", authCookie());
    expect(res.status).toBe(201);

    const payload = await received;
    expect(payload.order.status).toBe("Confirmed");
    socket.disconnect();
  });
});
