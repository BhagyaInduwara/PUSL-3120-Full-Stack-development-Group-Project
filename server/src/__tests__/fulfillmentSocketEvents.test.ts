import request from "supertest";
import { app } from "../app.js";
import { authCookie } from "./helpers/auth.js";
import { setIO, getIO } from "../utils/socket.js";
import { createTestOrder } from "./helpers/fixtures.js";

/**
 * Shipment and Production Job real-time events used to be wired through a
 * dead req.app.get("io") helper that nothing ever populated (see the fix
 * that replaced it with the shared emitEvent()/setIO() from utils/socket.ts)
 * — so unlike socketEvents.test.ts's Sales-pipeline coverage, this suite is
 * the first real verification that these two entities' broadcasts actually
 * fire.
 */
describe("Real-Time Socket Events — Fulfillment (Shipments, Production Jobs)", () => {
  const mockEmit = jest.fn();
  const cookie = authCookie();

  beforeEach(() => {
    mockEmit.mockClear();
    setIO({ emit: mockEmit });
  });

  afterAll(() => {
    setIO(null);
  });

  describe("Shipment Events (shipment.controller.ts)", () => {
    it("emits 'shipment:created' and 'shipment:changed' on creation", async () => {
      const order = await createTestOrder(app);

      const res = await request(app).post("/api/shipments").set("Cookie", cookie).send({ orderId: order._id });

      expect(res.status).toBe(201);
      expect(mockEmit).toHaveBeenCalledWith(
        "shipment:created",
        expect.objectContaining({ shipment: expect.objectContaining({ orderId: order._id }) })
      );
      expect(mockEmit).toHaveBeenCalledWith("shipment:changed", expect.any(Object));
    });

    it("emits 'shipment:changed' but not 'shipment:status_changed' on a PUT that doesn't touch status", async () => {
      const order = await createTestOrder(app);
      const created = await request(app).post("/api/shipments").set("Cookie", cookie).send({ orderId: order._id });
      mockEmit.mockClear();

      const res = await request(app)
        .put(`/api/shipments/${created.body.shipment.id}`)
        .set("Cookie", cookie)
        .send({ date: "2026-02-01" });

      expect(res.status).toBe(200);
      expect(mockEmit).toHaveBeenCalledWith("shipment:changed", expect.any(Object));
      expect(mockEmit).not.toHaveBeenCalledWith("shipment:status_changed", expect.anything());
    });

    it("emits 'shipment:status_changed' and 'shipment:changed' on dispatch", async () => {
      const order = await createTestOrder(app);
      const created = await request(app).post("/api/shipments").set("Cookie", cookie).send({ orderId: order._id });
      mockEmit.mockClear();

      const res = await request(app).patch(`/api/shipments/${created.body.shipment.id}/dispatch`).set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(mockEmit).toHaveBeenCalledWith(
        "shipment:status_changed",
        expect.objectContaining({ shipment: expect.objectContaining({ status: "Dispatched" }) })
      );
      expect(mockEmit).toHaveBeenCalledWith("shipment:changed", expect.any(Object));
    });

    it("emits 'shipment:status_changed' and 'shipment:changed' on deliver", async () => {
      const order = await createTestOrder(app);
      const created = await request(app).post("/api/shipments").set("Cookie", cookie).send({ orderId: order._id });
      mockEmit.mockClear();

      const res = await request(app).patch(`/api/shipments/${created.body.shipment.id}/deliver`).set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(mockEmit).toHaveBeenCalledWith(
        "shipment:status_changed",
        expect.objectContaining({ shipment: expect.objectContaining({ status: "Delivered" }) })
      );
      expect(mockEmit).toHaveBeenCalledWith("shipment:changed", expect.any(Object));
    });
  });

  describe("Production Job Events (productionJob.controller.ts)", () => {
    it("emits 'production_job:created' and 'production_job:changed' on creation", async () => {
      const res = await request(app)
        .post("/api/production-jobs")
        .set("Cookie", cookie)
        .send({ product: "Executive Desk", qty: 3, due: "2026-09-01" });

      expect(res.status).toBe(201);
      expect(mockEmit).toHaveBeenCalledWith(
        "production_job:created",
        expect.objectContaining({ productionJob: expect.objectContaining({ product: "Executive Desk" }) })
      );
      expect(mockEmit).toHaveBeenCalledWith("production_job:changed", expect.any(Object));
    });

    it("emits 'production_job:updated' and 'production_job:changed' on PUT", async () => {
      const created = await request(app)
        .post("/api/production-jobs")
        .set("Cookie", cookie)
        .send({ product: "Task Chair", qty: 2, due: "2026-09-05" });
      mockEmit.mockClear();

      const res = await request(app)
        .put(`/api/production-jobs/${created.body.productionJob._id}`)
        .set("Cookie", cookie)
        .send({ product: "Task Chair — Updated", qty: 4, due: "2026-09-10" });

      expect(res.status).toBe(200);
      expect(mockEmit).toHaveBeenCalledWith("production_job:updated", expect.any(Object));
      expect(mockEmit).toHaveBeenCalledWith("production_job:changed", expect.any(Object));
    });

    it("emits 'production_job:updated' and 'production_job:changed' on PATCH status", async () => {
      const created = await request(app)
        .post("/api/production-jobs")
        .set("Cookie", cookie)
        .send({ product: "Conference Table", qty: 1, due: "2026-09-12" });
      mockEmit.mockClear();

      const res = await request(app)
        .patch(`/api/production-jobs/${created.body.productionJob._id}/status`)
        .set("Cookie", cookie)
        .send({ status: "In Progress", progress: 50 });

      expect(res.status).toBe(200);
      expect(mockEmit).toHaveBeenCalledWith(
        "production_job:updated",
        expect.objectContaining({ productionJob: expect.objectContaining({ status: "In Progress" }) })
      );
      expect(mockEmit).toHaveBeenCalledWith("production_job:changed", expect.any(Object));
    });
  });

  it("does not throw when Socket.io hasn't been initialized (getIO() is null)", async () => {
    setIO(null);
    expect(getIO()).toBeNull();

    const res = await request(app)
      .post("/api/production-jobs")
      .set("Cookie", cookie)
      .send({ product: "Uninitialized Test", qty: 1, due: "2026-09-15" });

    expect(res.status).toBe(201);
  });
});
