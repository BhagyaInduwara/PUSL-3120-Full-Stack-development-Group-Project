import request from "supertest";
import { app } from "../app.js";
import { authCookie } from "./helpers/auth.js";

const cookie = authCookie();

// Connecting/clearing collections between tests/disconnecting after the
// suite is handled globally by setupTestDb.ts (setupFilesAfterEnv) — no
// need to repeat that per file.

/** Helper: create a valid production job and return the response. */
async function createJob(overrides: Record<string, unknown> = {}) {
  const payload = {
    product: "Executive Desk – Walnut",
    qty: 5,
    due: "2026-09-01",
    ...overrides,
  };
  return request(app).post("/api/production-jobs").set("Cookie", cookie).send(payload);
}

describe("Production Jobs /api/production-jobs", () => {
  // JOB-01: create with valid fields
  it("JOB-01: creates a production job with valid fields and a generated JOB- record number", async () => {
    const res = await createJob();

    expect(res.status).toBe(201);
    expect(res.body.productionJob).toBeDefined();
    expect(res.body.productionJob.number).toMatch(/^JOB-/);
    expect(res.body.productionJob.product).toBe("Executive Desk – Walnut");
    expect(res.body.productionJob.qty).toBe(5);
  });

  // JOB-02: reject missing required fields (schema-level — no hand-rolled
  // validation in this controller, so it falls through to the centralized
  // 500 handler, same pattern as Inventory's create endpoint).
  it("JOB-02: rejects creation with missing required fields (product/due)", async () => {
    const res = await request(app)
      .post("/api/production-jobs")
      .set("Cookie", cookie)
      .send({ qty: 5 });

    expect(res.status).toBe(500);
  });

  // JOB-03: reject qty below the schema minimum (min: 1)
  it("JOB-03: rejects creation with qty below 1", async () => {
    const res = await createJob({ qty: 0 });
    expect(res.status).toBe(500);
  });

  // JOB-04: default status/progress
  it("JOB-04: defaults status to 'Planned' and progress to 0 when not supplied", async () => {
    const res = await createJob();

    expect(res.status).toBe(201);
    expect(res.body.productionJob.status).toBe("Planned");
    expect(res.body.productionJob.progress).toBe(0);
  });

  // JOB-05: Make-to-Order linkage fields are optional and persisted when given
  it("JOB-05: persists the optional orderNumber/customer Make-to-Order link", async () => {
    const res = await createJob({ orderNumber: "ORD-2026/09/01/A001", customer: "Foothill Realty Partners" });

    expect(res.status).toBe(201);
    expect(res.body.productionJob.orderNumber).toBe("ORD-2026/09/01/A001");
    expect(res.body.productionJob.customer).toBe("Foothill Realty Partners");
  });

  // JOB-06: list all jobs
  it("JOB-06: lists all production jobs", async () => {
    await createJob({ product: "Job A" });
    await createJob({ product: "Job B" });

    const res = await request(app).get("/api/production-jobs").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.productionJobs)).toBe(true);
    expect(res.body.productionJobs).toHaveLength(2);
  });

  // JOB-07: fetch by valid id
  it("JOB-07: fetches a production job by valid id", async () => {
    const created = await createJob();
    const jobId = created.body.productionJob._id;

    const res = await request(app).get(`/api/production-jobs/${jobId}`).set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.productionJob._id).toBe(jobId);
  });

  // JOB-08: 404 for unknown id
  it("JOB-08: returns 404 for a non-existent production job id", async () => {
    const res = await request(app)
      .get("/api/production-jobs/000000000000000000000000")
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Production job not found");
  });

  // JOB-09: full update via PUT
  it("JOB-09: updates a job's scope fields via PUT", async () => {
    const created = await createJob({ qty: 5 });
    const jobId = created.body.productionJob._id;

    const res = await request(app)
      .put(`/api/production-jobs/${jobId}`)
      .set("Cookie", cookie)
      .send({ product: "Task Chair – Mesh Back", qty: 12, due: "2026-09-10" });

    expect(res.status).toBe(200);
    expect(res.body.productionJob.product).toBe("Task Chair – Mesh Back");
    expect(res.body.productionJob.qty).toBe(12);
  });

  // JOB-10: PATCH status/progress only
  it("JOB-10: PATCH /:id/status updates status and progress without touching scope fields", async () => {
    const created = await createJob({ product: "Conference Table" });
    const jobId = created.body.productionJob._id;

    const res = await request(app)
      .patch(`/api/production-jobs/${jobId}/status`)
      .set("Cookie", cookie)
      .send({ status: "In Progress", progress: 40 });

    expect(res.status).toBe(200);
    expect(res.body.productionJob.status).toBe("In Progress");
    expect(res.body.productionJob.progress).toBe(40);
    expect(res.body.productionJob.product).toBe("Conference Table");
  });

  // JOB-11: reject an invalid status (schema enum — same 500 pattern as JOB-02/03)
  it("JOB-11: rejects an invalid status value via PATCH", async () => {
    const created = await createJob();
    const jobId = created.body.productionJob._id;

    const res = await request(app)
      .patch(`/api/production-jobs/${jobId}/status`)
      .set("Cookie", cookie)
      .send({ status: "Bogus" });

    expect(res.status).toBe(500);
  });

  // JOB-12: reject unauthenticated requests
  it("JOB-12: rejects unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/production-jobs");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Not authenticated.");
  });
});
