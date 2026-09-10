# FlowERP — Contributions

**Project:** FlowERP (PUSL 3120 Full-Stack Development, Group 55)

This reflects the project's git commit history across every branch
(`git log --all`), grouped by author and theme — it's what each person
actually committed, not a restatement of ClickUp task assignments (a task
assigned to someone in planning doesn't always match who ended up writing
the commit for it, especially late in the project). Merge commits and
one-line typo fixes are omitted; everything below is a real, identifiable
piece of work.

## Bhagya Induwara

Project integrator — merged every branch into `dev`/`main`, resolved the
resulting conflicts, and owned the authentication, testing, real-time, and
DevOps infrastructure most other work was built on top of.

- **Foundation (M1–M2):** initial project scaffold, `DB_V1.sql` schema and
  env config, human-readable order/invoice/shipment record numbers,
  multi-line-item Order redesign, working New Order/Invoice/Shipment
  forms, drag-and-drop Kanban for Production Jobs, confirm/undo staging
  for Kanban moves.
- **Authentication:** the Next.js-side auth prototype, then its full
  cutover to the Express/MongoDB backend — JWT session verification,
  same-origin API proxy (to avoid third-party-cookie blocking), and fixing
  a cross-domain cookie bug along the way.
- **Backend/data integrity:** DB connection pooling and schema docs,
  removing the dead `ERPStore`/repository layer once every entity had
  migrated to the real backend, repairing several merge-conflict and
  backend-wiring regressions in Order/Production/Inventory/Dashboard.
- **Testing infrastructure:** set up Playwright + Chromium E2E, Jest +
  Supertest (server) and Jest + RTL (frontend) from scratch; wrote the
  Dashboard/Production/Inventory component tests, the Auth/Users server
  tests, the missing Production Jobs integration tests, and the two-client
  Socket.io E2E test covering the full order-to-delivery flow; found and
  fixed a real bug (Shipment "Delivered" immutability not enforced
  server-side) with a regression test.
- **Real-time & DevOps:** built the Socket.io server (authenticated
  handshake) and the frontend connection/`useLiveEvent()` hook, wired
  live-sync into Invoicing/Shipments/Production, fixed a build break from
  two people independently wiring real-time broadcasts through different
  (one of them dead) mechanisms, wrote `docker-compose.yml`, and fixed two
  separate production build breaks (`next.config.ts`'s `output:
  "standalone"` conflicting with Vercel, and `server/` leaking into the
  root `tsconfig`).
- **CI & docs:** GitHub Actions environment setup, the Postman collection,
  and the final README/schema docs.

## Chinthana Sathyajith

- **Authentication:** wired login/registration and the Users settings
  page to the Express backend, aligned auth endpoints with the team's REST
  contract.
- **Dashboard:** wired the revenue chart and activity feed to live backend
  endpoints, added empty-state handling to dashboard cards.
- **Sales:** built the 4-stage pipeline stepper (compact card view and the
  detailed order-progress view).
- **Production:** the New Production Job popup, and linking production
  jobs to their originating sales order/customer for Make-to-Order
  traceability.
- **Offline support:** built `fetchWithCache` (the shared client-side
  caching utility every data-fetching page now uses) and the reactive
  `OfflineBanner`.
- **DevOps:** the client and server Dockerfiles, `output: "standalone"`
  configuration, and the nginx reverse proxy config (`/`, `/api/`,
  `/socket.io/`, `/health` routing).
- **Testing:** Jest + Supertest infrastructure plus the Inventory and
  Master Data (Products/Customers/Suppliers) integration test suites.
- **Docs:** the system-wide ERD/schema documentation and the team's REST
  resource design/API standards guide.

## Parami

- **Backend:** the `Order` and `IncomingOrderDraft` models, controllers,
  and routes; real-time Socket.io events for the Orders pipeline, Order
  Drafts/approvals, and Invoices/payments, with their own unit tests.
- **Dashboard:** the Sales-by-Category donut chart and Top Performing
  Products leaderboard analytics cards.
- **Shipments:** schema/relations/delivery-lifecycle documentation, and
  verifying MongoDB shipment persistence end to end.
- **Frontend testing:** Jest + RTL environment setup, plus unit tests for
  the Sales OrderBoard, OrderCard, NewOrderDialog, OrderDetailDialog, and
  the Sales offline-fallback/cache-resiliency suite.
- **Cleanup:** retired the mock `ShipmentRepository` and the remaining
  parts of `ERPStore` once Shipments moved to the real backend.

## Sanu Minrada

- **Backend:** Customer/Supplier/Product CRUD routes, and the
  Invoices + Shipments (billing & fulfillment) backend task.
- **Real-time:** live-synced the Sales & Order Board via Socket.io's
  `order:changed` event.
- **UI:** light/dark theme support and the profile view; gated record
  editing to Draft/Planned status only.
- **Data migration:** retired the Order mock data, added Sales offline
  caching, verified order persistence against MongoDB, and documented the
  Order/Draft/Counter schemas.
- **Testing:** Jest + Supertest tests for the Orders, Invoices, and
  Shipments APIs.

## Manumi

- **Frontend:** wired Inventory, Production, and Dashboard to the real
  backend; built the Adjust Stock modal.
- **Real-time:** non-blocking Socket.io events for Shipments and
  Production Jobs.
- **Data migration:** completed mock-data retirement and MongoDB invoice
  persistence, plus offline caching for those modules.
- **Testing:** the Milestone 4 test suites, and unit/component tests for
  the offline cache and the Settings dialogs (Products/Customers/
  Suppliers/Users).

## Amasha Rathnayaka

- **Backend/docs:** `API_CONTRACT.md` (the formal API specification), and
  early groundwork — the `ERPStore` implementation, schema documentation,
  and the original repository-layer infrastructure (M2), later retired
  once the project cut over to the real backend.
- **Settings:** the Customer Detail View.
