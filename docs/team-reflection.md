# FlowERP — Team Reflection

**Project:** FlowERP (PUSL 3120 Full-Stack Development, Group 55)
**Milestones covered:** M1 – M5

## What we set out to build

A working ERP dashboard — Sales, Invoicing, Inventory, Shipments, and
Production — from a static design mockup, on the course's mandated stack:
a React/Next.js frontend, an Express + Mongoose backend in its own
routes/controllers/models structure, MongoDB persistence, custom
register/login auth with protected routes, client-side caching for
offline resilience, a Jest/Supertest test suite wired into CI, Socket.io
real-time sync, and a Dockerized, publicly deployed final build.

## What went well

- **The domain layer held up.** Building `Entity`/`Money`/`StatusfulEntity`
  and the per-entity classes early (M1–M2) meant that every later
  migration — swapping the data source from in-memory repositories to
  Supabase-shaped SQL to, finally, the real Express/MongoDB backend —
  never touched the UI components. `canEdit`/`update()` gating status
  transitions in the domain layer, not just the UI, is also what caught
  a real bug later (see below) instead of silently allowing it.
- **Splitting ownership by module** (Sales, Invoicing, Inventory,
  Shipments, Production, Settings/Users) let five people work in parallel
  without constantly blocking on the same files, and it made code review
  legible — each PR mapped to one screen or one backend concern.
- **The real-time layer came together fast once the pattern was set.**
  Once the Socket.io server infra and the shared `useLiveEvent()` hook
  existed, extending live sync to a new screen was a small, mechanical
  change (a broadcast on the controller side, one hook call on the page)
  — Sales, Invoicing, Shipments, and Production all picked it up within a
  day of each other.
- **Writing a failing test before fixing a bug paid off immediately.**
  The Shipment "Delivered" immutability bug (see below) had a regression
  test in place before the fix landed, so it can't silently come back.

## What was harder than expected

- **Parallel work on the same real-time feature converged badly more
  than once.** Two teammates independently built a socket broadcast
  helper for different controllers under different names in different
  files, and a merge silently kept both imports — the build broke with a
  duplicate-identifier error, and worse, the *other* controllers'
  broadcasts had been wired through a helper (`req.app.get("io")`) that
  nothing ever populated, so they were silently no-ops even though the
  code looked complete. The lesson: a real-time/event layer needs one
  obviously-canonical entry point decided *before* multiple people start
  building against it, not reconciled after the fact.
- **Deploying to Vercel and packaging for Docker pulled `next.config.ts`
  in opposite directions.** `output: "standalone"` is required for the
  self-hosted Docker image but actively breaks a Vercel build (it changes
  where Next.js emits its server trace files, which Vercel's own build
  pipeline doesn't expect) — production broke twice from this exact
  setting before we made it conditional on Vercel's own `VERCEL` build-time
  env var so both targets can coexist.
- **Testing a shared, real Atlas cluster instead of a disposable database
  meant every manual/E2E verification pass had to clean up after itself.**
  It's easy to leave a throwaway order or shipment behind; we made a habit
  of deleting test-created records immediately after verifying a feature,
  including writing one-off cleanup scripts when a fixture had no DELETE
  route (invoices and shipments move through a lifecycle instead of being
  removable, by design).
- **Native HTML5 drag-and-drop (the Kanban boards) is genuinely awkward
  to browser-test.** Getting Playwright to reliably trigger a real
  `dragstart`/`dragover`/`drop` sequence, and then correctly scoping
  locators so a drag on one client's board doesn't get confused with a
  visually-identical card from unrelated seed data on the second client,
  took real iteration rather than working on the first attempt.

## What we'd do differently

- Agree on a single events/broadcast module (names, payload shape) *before*
  starting real-time work on more than one screen, instead of after a
  merge conflict forces the conversation.
- Write the Docker/production config earlier and test both deploy targets
  (Vercel and Docker) from the start, rather than adding standalone-output
  support only once Docker work began and finding out it regressed the
  already-working Vercel deployment.
- Keep a running list of "manual test data created against the shared
  cluster" during heavy feature work, rather than relying on remembering
  to clean up after each session.

## Where the project ended up

By the end of M5: full CRUD across every core entity against a real
MongoDB Atlas cluster, custom JWT auth with protected routes on both the
frontend and backend, client-side caching with an offline indicator,
Socket.io real-time sync across Sales/Invoicing/Shipments/Production
(server infra, authenticated handshake, and a shared frontend hook), a
Jest/Supertest suite covering auth, users, and every core entity plus its
real-time broadcasts, a Playwright E2E suite including a two-client
live-sync test that exercises the entire order-to-delivery flow through
the real UI, Dockerfiles for both apps behind an nginx reverse proxy via
Docker Compose, and a public Vercel deployment.
