# Test Coverage Report

**Generated:** 2026-09-12, against `dev-induwara` at the commit that added
the ProductionJob "Completed" immutability guard (see
[`bug-report.md`](bug-report.md)). Regenerate with the commands in each
section below — none of the numbers here are hand-typed estimates.

## Summary

| Suite | Tool | Files | Coverage (measured) |
|---|---|---|---|
| Backend integration | Jest + Supertest, against a real Express app + ephemeral in-memory MongoDB (`mongodb-memory-server`) | 11 spec files under `server/src/__tests__/` | **Statements 84.82%, Branches 67.54%, Functions 86.91%, Lines 84.99%** (`cd server && npx jest --coverage`) |
| Frontend unit | Jest + React Testing Library | 19 spec files under `testing/unit/` | 19 component/hook suites — see "Frontend suite breakdown" below. A repo-wide line-coverage percentage isn't currently wired into `testing/jest.config.js`; see Limitations. |
| End-to-end | Playwright + Chromium, against the real running app | 3 spec files under `testing/e2e/` | Not statement-coverage in the traditional sense — see "End-to-end scope" below. |

## Backend coverage by area

Run: `cd server && npx jest --coverage` (11 suites / 123 tests, all passing).

| Area | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `src/routes/*` (all 11 routers) | 100% | 100% | 100% | 100% |
| `src/models/*` (all 12 models) | 100% | 77.3% | 100% | 100% |
| `src/middleware/auth.ts` | 100% | 100% | 100% | 100% |
| `src/controllers/*` (overall) | 77.1% | 65.9% | 82.1% | 77.2% |
| `src/config/*` | 93.3% | 70% | 100% | 93.3% |
| `src/realtime/socket.ts` | 89.3% | 75% | 80% | 89.3% |
| `src/utils/*` | 100% | 75% | 100% | 100% |

Every write path that carries a real business rule is directly exercised
through the real HTTP routes: auth/session handling, master-data
(Customer/Supplier/Product) CRUD and validation, Orders/Order Drafts,
Invoices, Shipments (including the "Delivered" immutability guard),
Production Jobs (including the "Completed" immutability guard — see
`bug-report.md`), Inventory, and every `emitEvent` real-time broadcast.

**Why controller coverage sits at ~77% rather than near 100%:** the
uncovered lines are concentrated in a few controllers, not spread evenly:

- **`user.controller.ts` (28% statements)** — `listUsers`/`createUser`
  are exercised via `auth.test.ts` and `masterData.test.ts`'s shared auth
  helper, but most of its own request-shape validation branches (missing
  `role`, invalid `role` value, duplicate-username edge cases beyond the
  one path `auth.test.ts` covers) aren't separately tested here — this is
  the single largest opportunity for new backend tests.
- **`dashboard.controller.ts` (37.5% statements)** — `/api/activity` and
  `/api/revenue-series` have no dedicated `__tests__` spec file at all
  yet (see the new §4.12 in `API_CONTRACT.md`); the coverage that does
  exist comes only from these routes being mounted and hit incidentally.
  Worth a `dashboard.test.ts` as a follow-up.
- **Defensive/edge-case branches elsewhere** (`customer`/`supplier`/
  `product.controller.ts`, each ~72–78%) — mostly the malformed-input
  branches (empty-string vs. missing-field vs. wrong-type) that aren't
  each individually asserted, plus a couple of `catch` blocks around
  unexpected Mongoose errors that no test deliberately triggers.

## Frontend suite breakdown

Run: `npm run test:unit` (19 suites / 64 tests, all passing).

Component/hook suites cover: Dashboard (`Dashboard.test.tsx`), Sales board
& dialogs (`OrderBoard`, `OrderCard`, `NewOrderDialog`,
`OrderDetailDialog`, `PendingMoveBanner`, `SalesOffline`), Production
board & dialogs (`JobColumn`, `JobDetailDialog`), Inventory
(`InventoryTable`), Settings dialogs (`CustomerDetailDialog`,
`SupplierDetailDialog`, `ProductDetailDialog`, `AddProductDialog`,
`UserDetailDialog`, `UsersManager`), the offline-cache layer
(`fetchWithCache.test.ts`, `OfflineBanner.test.tsx`), and the Socket.io
client provider (`SocketProvider.test.tsx`).

## End-to-end scope

Run: `npm run test:e2e` (3 spec files / 4 tests, all passing — see
[`test-report.md`](test-report.md) for the full run and what each test
actually drives).

- `login.spec.ts` — valid credentials, wrong password.
- `conflict-detection.spec.ts` — a stale concurrent edit is rejected
  (409) instead of silently overwriting a newer change.
- `full-flow-live-sync.spec.ts` — the entire order-to-delivery pipeline
  driven through the real UI on one browser context while a second,
  independently logged-in context is asserted to see every change live
  over Socket.io.

E2E is deliberately a small, high-value smoke suite (real user journeys
through the real UI against a real running stack), not a
statement-coverage tool — Jest/Supertest and Jest/RTL are what measure
code coverage in this project.

## Limitations

- **No repo-wide frontend line-coverage percentage.** `testing/jest.config.js`
  doesn't currently pass `--coverage`/`collectCoverage` — component tests
  focus on behavior (does the dialog save, does the offline banner show)
  rather than line counting. Running `npx jest --config=testing/jest.config.js --coverage`
  manually works and would be a reasonable follow-up to wire into `npm run test:unit`.
- **Backend's ~15% uncovered statements** are concentrated in the three
  areas listed above (`user.controller.ts`, `dashboard.controller.ts`,
  and scattered defensive branches) rather than spread evenly across the
  codebase — see "Backend coverage by area."
