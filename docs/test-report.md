# Test Report

**Run date:** 2026-09-12, against `dev-induwara`. All suites below were
actually executed for this report, not estimated — see each section for
the exact command.

## Results

| Suite | Command | Result |
|---|---|---|
| Backend | `cd server && npm test` | **11 suites / 123 tests passed** |
| Frontend unit | `npm run test:unit` | **19 suites / 64 tests passed** |
| End-to-end | `npm run test:e2e` | **3 spec files / 4 tests passed** |

Full coverage breakdown for the backend and frontend suites lives in
[`test-coverage-report.md`](test-coverage-report.md).

## End-to-end detail

`full-flow-live-sync.spec.ts` opens two independent, separately
logged-in browser contexts and drives the entire order-to-delivery
pipeline through the real UI on client A — create order → confirm
(drag-and-drop) → invoice → dispatch shipment → deliver shipment →
schedule a linked production job — while client B, sitting on each of
those same screens, is asserted to show every one of those changes live,
without ever reloading or refetching. This is the strongest evidence in
the test suite that the Socket.io real-time layer works end-to-end, not
just that each REST endpoint responds correctly in isolation.

`conflict-detection.spec.ts` verifies the optimistic-concurrency-control
feature (`expectedUpdatedAt`, documented in `API_CONTRACT.md`'s
"Concurrency Control" section): two clients open the same record, one
saves first, and the second client's save — built against the
now-stale `updatedAt` it originally read — is rejected with a clear
message instead of silently overwriting the first client's change.

`login.spec.ts` covers valid credentials (redirect to `/dashboard`,
session cookie set) and wrong password (stays on `/login`, inline error,
no cookie set).

**A testing gotcha worth recording:** Playwright's `webServer` config
uses `reuseExistingServer: !CI`, meaning a local run attaches to whatever
is already listening on ports 3000/4000 instead of starting fresh. If an
earlier `npx playwright test` run was killed abruptly (e.g. a backgrounded
shell torn down mid-run) rather than exiting cleanly, its `npm run dev:all`
child processes (`next dev`, `tsx watch src/server.ts`, plus Turbopack
worker processes) can be left running and still holding those ports. A
second run then either binds to a *different*, stale server instance or
gets inconsistent results (login timing out, requests hitting an old
build) that look like a real regression but aren't one. Symptom: tests
that passed on a clean run suddenly fail with unrelated-looking timeouts.
Fix: check `Get-NetTCPConnection -LocalPort 3000,4000 -State Listen` (or
`lsof -i :3000` on macOS/Linux) for stray listeners, kill them, and
re-run against a clean port.

## Real bugs found and fixed during test development

Two instances of the same class of bug — a domain class documenting an
immutability rule that only the frontend UI enforced, with no equivalent
check in the backend API:

1. **Shipment "Delivered" immutability** — `PUT /api/shipments/:id`
   allowed editing a shipment already at `"Delivered"` status. Found
   while writing `shipment.test.ts`; fixed with a `409 Conflict` guard in
   `shipment.controller.ts`. Full writeup: [`bug-report.md`](bug-report.md).
2. **ProductionJob "Completed" immutability** — the same gap, for
   `PUT /api/production-jobs/:id`. Flagged as a known follow-up in the
   original bug report, then fixed the same way — `409 Conflict` guard in
   `productionJob.controller.ts`, with regression tests (`JOB-13` in
   `productionJobs.test.ts`) confirming both the rejected edit on a
   Completed job and that a non-Completed (Planned) job can still be
   updated normally. See [`bug-report.md`](bug-report.md)'s "Related gap,
   fixed as a follow-up" section.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every
push/PR (`branches: ["**"]`) and executes the backend (Jest + Supertest)
and frontend (Jest + React Testing Library) suites — neither needs any
repository secrets, since the backend suite starts its own ephemeral
in-memory MongoDB and the frontend suite is pure component tests.
Verified green directly against the GitHub Actions API
(`GET /repos/.../actions/runs`) as of this report: the most recent runs
on `main`, `dev`, and `dev-induwara` all report
`"status": "completed", "conclusion": "success"`.

The Playwright E2E suite is a deliberate follow-up, not yet wired into
CI — it drives the real running app against a real MongoDB connection
(not the ephemeral in-memory database the other two suites use), so it
needs a dedicated test `MONGODB_URI`/`JWT_SECRET` configured as GitHub
Actions secrets first. See the commented-out job block at the bottom of
`ci.yml`.
