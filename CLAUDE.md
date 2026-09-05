# FlowERP — Project Notes

This file is the running record of how FlowERP was built: what was
imported, the architecture decisions and why, and how each OOP concept
shows up in actual code. Update it whenever the architecture changes —
don't let it drift into a description of a codebase that no longer exists.

## What this is

FlowERP is an ERP dashboard (orders, invoicing, inventory, shipments,
production, settings) implemented from a Claude Design mockup:
`FlowERP Dashboard.dc.html` (project `3011fb5d-93f9-480a-ba74-ac7a06376df0`,
design system "Nocturne"). The mockup was a single self-contained file: one
`class Component extends DCLogic` holding all state, wired to an HTML
template via `{{ }}` bindings. This repo turns that into a real Next.js
app with the same visual design, backed by a proper class-based domain
model instead of one big component.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
for the frontend, plus a separate Express + Mongoose backend (`/server`,
see "Backend (Express + Mongoose)" below).
**Requirement driving the architecture:** strict OOP, components-based,
ready to swap in a real database/API later without touching the UI —
*and*, as of the course's Group Project Brief, a specific mandated stack
per layer (React frontend; Node.js + Express with a routes/controllers/models
structure; MongoDB via Mongoose; register/login with protected routes;
client-side persistence; concurrent-edit detection; Jest/Supertest tests
in CI; Socket.io real-time; Docker + public deployment). This repo's
Next.js app satisfies the frontend half and was built first (including a
self-contained, in-app auth+Supabase prototype, described below) before
the brief's exact backend requirements were confirmed — `/server` is the
real backend being built to match them literally, since Next.js API
routes and Supabase don't count as "Express" or "MongoDB/Mongoose" for
grading purposes.

## Architecture at a glance

```
src/
  domain/          Entity classes — identity + behavior, no React, no fetch
  repositories/     Data access — one interface, swappable implementations
  store/            ERPStore — the app's state, framework-agnostic
  components/       Presentational React components, grouped by feature
  app/              Next.js routes — thin: fetch from the store, render components
  server/auth/      Server-only auth (sessions, password hashing) — see "Authentication & Users"
  proxy.ts          Route protection, runs before every matched request
```

Data flows one direction: **repositories → ERPStore → useERPStore() → components**.
Nothing above the repository layer knows or cares that today's
repositories are in-memory arrays instead of HTTP calls to a real backend.

### Why this split (and not React class components everywhere)

We considered three options and picked "domain classes + functional
components":

1. Domain classes + functional components ← **chosen**
2. React class components for every UI piece
3. Both combined

React class components (`extends React.Component`) don't compose with
hooks, Server Components, or the App Router's data model, and would have
meant re-deriving all of React's modern conveniences by hand. The OOP
requirement is honored where it actually matters — the **data and
business logic** — via real classes with encapsulation, inheritance and
polymorphism (`domain/`, `repositories/`, `store/ERPStore.ts`). The
**UI** stays declarative functional components, which is what Next.js
and React 19 are designed around. This mirrors the original mockup's own
shape, which also kept one class as the logic/state owner
(`class Component extends DCLogic`) separate from the template.

## OOP concepts, with receipts

- **Encapsulation** — [`Order`](src/domain/Order.ts) keeps `status` behind
  a private field; the only way to change it is `moveTo()`, so the class
  stays the one place a future status-transition rule would go. Same
  pattern in [`Invoice`](src/domain/Invoice.ts) (`markPaid()`, `send()`)
  and [`Shipment`](src/domain/Shipment.ts) (`dispatch()`, `deliver()`).
  Editable fields are gated the same way: `Order`, `Invoice`, `Shipment`
  and [`ProductionJob`](src/domain/ProductionJob.ts) each expose a
  `canEdit` getter (true only in that entity's not-yet-actioned status —
  `"Draft"` for the first three, `"Planned"` for a job, since jobs have no
  Draft status) and an `update(patch)` method that silently no-ops if
  `canEdit` is false — so "only drafts can be edited" is enforced in the
  domain layer, not just by hiding the Edit button in the UI.
  [`User`](src/domain/User.ts) takes this further: its password hash has
  no public getter at all, only a `toPublic()` that structurally can't
  include it — see "Authentication & Users" below.
- **Abstraction** — [`Repository<T>`](src/repositories/Repository.ts) is
  an interface; `ERPStore` and every component depend on that interface,
  never on "it's an in-memory array." Swapping storage means writing one
  new class per repository, not touching the store or UI.
- **Inheritance** — every domain entity extends
  [`Entity`](src/domain/Entity.ts) (identity). `Order`, `Invoice`, and
  `Shipment` further extend
  [`StatusfulEntity`](src/domain/StatusBadge.ts) (identity + a status
  lifecycle). Every repository extends
  `InMemoryRepository<T>` for the shared array-backed CRUD.
- **Polymorphism** — [`StatusTag`](src/components/ui/Tag.tsx) renders
  *any* `Statusable` entity by calling `entity.badgeStyle()`; it has no
  switch statement on entity type. `Order`, `Invoice`, and `Shipment`
  each satisfy the interface with their own status, and the component
  doesn't need to know which one it got.
- **Single Responsibility** — domain classes hold data + intrinsic
  behavior only; cross-entity joins (e.g. "what customer does this
  invoice bill?") live in `ERPStore` (`invoiceCustomer()`,
  `shipmentCustomer()`), because no single entity owns that relationship.
  UI-only state (dialog open/closed, form field values, which sales view
  is showing) lives in the component that needs it via `useState`, not in
  `ERPStore` — it's not domain data and doesn't need to survive
  navigation.
- **Factory method** — [`IncomingOrderDraft.toOrder()`](src/domain/IncomingOrderDraft.ts)
  turns a reviewed email-parsed draft into a real `Order`. The
  "New Order" panel calls this through `ERPStore.approveIncomingDraft()`.
- **Value objects** — [`Money`](src/domain/Money.ts) wraps dollar amounts
  as integer cents so formatting/arithmetic can't drift from
  floating-point error; it's immutable (`add`/`multiply` return new
  instances).
- **Dependency inversion** — `ERPStore` composes concrete
  `InMemoryRepository` subclasses today, but every method signature it
  exposes (`orders`, `findOrder`, ...) is shaped by the `Repository<T>`
  interface, not by "array." See "Swapping in a real database" below.
- **Observer pattern** — [`Observable`](src/store/Observable.ts) is a
  minimal pub/sub base class with no React import. `ERPStore extends
  Observable` and calls `this.notify()` after every mutation.
  [`useERPStore`](src/store/useERPStore.ts) is the *only* place that
  bridges it into React, via `useSyncExternalStore`. This is what lets
  `ERPStore` stay framework-agnostic (it would work in a script or a test
  with no React runtime) while components still re-render on change.
- **Composition over duplication** — [`RecordDialog`](src/components/ui/RecordDialog.tsx)
  is the one popup shell for viewing/editing a record (see "Record detail
  popups" below). It owns the view/edit toggle and Save/Cancel/Close
  chrome; each feature's `*DetailDialog` composes it and supplies only its
  own fields via a `children(mode)` render prop, instead of four separate
  popup implementations copying the same modal/edit-toggle boilerplate.

## The data layer, and swapping in a real database

Every repository still under `src/repositories/*.ts` implements the
[`Repository<T>`](src/repositories/Repository.ts) interface and is
backed by `InMemoryRepository`, seeded from
[`seed-data.ts`](src/repositories/seed-data.ts) (ported 1:1 from the
`state = {...}` block in the original `.dc.html`). This was originally
written for a hypothetical swap where a new repository class would
implement the same interface and get injected into `ERPStore`, with
`components/`/`app/` never needing to change because they only ever
called `ERPStore` methods.

**That's not the path Order actually took, and it's worth knowing why.**
Order (and its `IncomingOrderDraft`) were the first entity fully wired to
the real Express + MongoDB backend (see "Backend (Express + Mongoose)"
below) — `OrderRepository` was deleted outright, `ORDER_SEED`/
`INCOMING_DRAFT_SEED` removed from `seed-data.ts`, and every
Order-dependent method stripped from `ERPStore` (see its git history if
you need the old shape) rather than reimplemented against `Repository<T>`.
Instead, [`sales/page.tsx`](<src/app/(app)/sales/page.tsx>) talks to
`/api/orders` and `/api/order-drafts` directly with `fetch()` — plain
component-local `useState`/`useEffect`, no `ERPStore` involved at all.
`useERPStore()` is not called anywhere in the app any more; `ERPStore`
itself is dead code for every entity that's made this same jump. The
`Repository<T>` abstraction did its job as a placeholder while the real
backend didn't exist yet, but the actual migration turned out to be "the
page owns its own fetches" rather than "swap the class behind the
interface" — worth remembering before assuming any given screen still
reads from `ERPStore`. Check whether the page does its own `fetch()`
before touching a repository or `ERPStore` method for an entity you're
working on.

Repository mutation methods that are currently synchronous (`add`,
`moveStatus`, `markPaid`, ...) will need to become `async` for any
remaining mock entity that makes this same jump — that ripples into
`ERPStore`'s action methods and the components that call them, but by the
time that's needed the "page calls `fetch()` directly" pattern Order
established is probably the more likely path anyway.

## Authentication & Users

Custom username/password auth, not Supabase Auth — deliberately. The plan
is to migrate off Supabase to MongoDB later, and Supabase Auth's user
store doesn't travel with that move, so login/session logic is hand-rolled
against a plain `users` table/repository instead, the same way every
other entity in this app is. Default account: **admin / admin@123**
(seeded by both `src/repositories/user-seed-data.ts` and
`DB_V1_Insert.sql` — see below).

**Domain** — [`User`](src/domain/User.ts) extends `Entity` like everything
else, but its password hash sits behind a private field with *no* public
getter for the raw value; the only way to get data out of a `User` for a
response body is `toPublic()`, which structurally cannot include the
hash. This is the same encapsulation pattern as `Order.status` — the
class itself decides what's safe to expose, not each call site
remembering to omit a field.

**Server-only boundary** — everything that can see a password hash lives
under `src/server/auth/` or in `UserRepository`/`user-seed-data.ts`, and
every one of those files opens with `import "server-only"` (the
[`server-only`](https://www.npmjs.com/package/server-only) package, which
makes it a **build error** — not just a lint warning — for a `"use client"`
file to import one of them, even transitively). This is why Users
management is the one Settings tab that *isn't* a client component
reading `ERPStore`: [`settings/users/page.tsx`](<src/app/(app)/settings/users/page.tsx>)
is a Server Component that calls `userRepository.findAll()` directly and
hands only the already-public shape down to the client
[`UsersManager`](src/components/settings/UsersManager.tsx). `User`/`PublicUser`
types are still exported from the shared `src/domain` barrel (they're
just plain types, nothing sensitive), but `UserRepository` itself is
never reachable from `ERPStore`.

**Sessions** — [`token.ts`](src/server/auth/token.ts) hand-rolls a small
signed token (JSON payload + HMAC-SHA256 signature, base64url,
dot-separated — the same shape as a JWT, without a JWT library), built
entirely on the Web Crypto API (`crypto.subtle`) so the identical code
verifies a session in every runtime the app touches it from. There's no
server-side session store: the signature alone is what makes the token
trustworthy, checked via `crypto.subtle.verify` (timing-safe). The
trade-off is that a session can't be revoked before it expires
(7 days, `SESSION_MAX_AGE_SECONDS`) — acceptable for a single-admin V1,
worth a real session table once the database is real.
[`session.ts`](src/server/auth/session.ts) wraps this with cookie
read/write (`next/headers`) and a `getSessionUser()` that also confirms
the user still exists, for use in Server Components/Route Handlers.

**Passwords** — [`PasswordHasher`](src/server/auth/PasswordHasher.ts) is
the one place bcrypt (via `bcryptjs`) gets called from. Its hashes are
wire-compatible with Postgres's `pgcrypto` `crypt(..., gen_salt('bf'))`,
which is what `DB_V1_Insert.sql` uses to seed the admin row — so a future
`SqlUserRepository` could verify a password against either side's hash
without re-hashing anything.

**Route protection** — [`src/proxy.ts`](src/proxy.ts) (Next.js 16 renamed
the `middleware.ts` file convention to `proxy.ts` — same job, same
`export function` shape, just `proxy` instead of `middleware`; migrated
with `npx @next/codemod@canary middleware-to-proxy`) runs before every
matched request, verifies the session cookie via `token.ts` only (no
repository, no bcrypt — it trusts the token's signed claims rather than
re-checking the database on every request), and redirects to `/login` if
there's no valid session, or away from `/login` if there already is one.
API routes are excluded from its matcher and instead guard themselves
inline (`getSessionUser()` inside each `route.ts`), returning 401/403
JSON rather than a redirect — redirecting a `fetch()` call to an HTML
login page would just break the caller.

**Endpoints** — `POST /api/auth/login`, `POST /api/auth/logout`,
`GET /api/users` (any signed-in user), `POST /api/users` (admin role
only — checked server-side via `getSessionUser().role`, not just a
hidden "Add user" button in the UI). Login compares against a dummy
bcrypt hash when the username doesn't exist, so "no such user" and
"wrong password" take roughly the same time — a minor defense against
timing-based username enumeration.

**A real bug this surfaced, worth remembering**: the first version of
`UserRepository` exported a plain `export const userRepository = new
UserRepository()` module-level singleton — the same pattern every other
repository already uses safely, since they're only ever imported from
client-side `ERPStore` code bundled together. `UserRepository` is
different: it's imported from *both* a Route Handler (`/api/users`) and a
Server Component (`settings/users/page.tsx`). In dev, under Turbopack,
those two ended up with **separate module instances** — a user created
through the API was visible to `curl` hitting `/api/users` directly, but
invisible to the Server Component reading the "same" import a moment
later, even after a full page reload. The fix was anchoring the instance
on `globalThis` instead (see the comment in
[`UserRepository.ts`](src/repositories/UserRepository.ts)) — the standard
fix for this exact class of bug (it's the same pattern Prisma's own
Next.js docs recommend for its client instance). The deeper lesson: a
plain module-level singleton is not guaranteed to be *the same object*
everywhere in Next.js — Route Handlers and Server Components can land in
different module graphs in dev, and most production deployments run each
route as its own serverless invocation with no shared memory at all. A
real database sidesteps this entirely, since the database becomes the
shared state instead of process memory — one more reason this in-memory
version is explicitly a placeholder.

**Status: this Next.js-side auth is a validated prototype, not the
graded backend.** Everything above (`src/proxy.ts`, `src/app/api/auth/*`,
`src/app/api/users/*`, `src/server/auth/*`, the in-memory
`UserRepository`) was built and verified end-to-end first — login, wrong
password, logout, route protection, and the Users tab all confirmed
working in a real browser — to prove the auth *design* before committing
it to the brief's mandated stack. It's being superseded by the real
Express + Mongoose backend below, not thrown away: the password-hashing
approach, the `User` shape, the encapsulation pattern, and the whole
Settings → Users UI carry over directly. Once `/server` is confirmed
working end-to-end (needs a real `MONGODB_URI` — see below), the plan is
to point the frontend's auth calls at `/server` instead and delete the
Next.js-side auth code so there's exactly one backend, not two.

## Backend (Express + Mongoose)

A separate app in [`/server`](server/), independent of the Next.js app
and its `package.json`/`node_modules`. This exists specifically because
the course's Group Project Brief mandates "Node.js and Express, following
a routes/controllers/models structure" and "MongoDB via Mongoose" for the
backend — Next.js's own Route Handlers and Supabase/Postgres (both used
elsewhere in this repo) don't satisfy either of those literally, even
though they do the same job. Where the Next.js app is deliberately
class-heavy OOP (see "OOP concepts" above), this backend deliberately
follows plain, idiomatic Express/MVC conventions instead — that's what's
actually being graded on the backend side ("clear separation of concerns
(routes/controllers/models)").

**Layout:**

```
server/
  src/
    config/       env.ts (fail-fast env var validation), db.ts (Mongoose connect)
    models/       User.ts, Customer.ts, Supplier.ts, Product.ts, Order.ts (placeholder —
                  see "Invoices & Shipments" below), Invoice.ts, Shipment.ts
    controllers/  auth.controller.ts, user.controller.ts, customer.controller.ts,
                  supplier.controller.ts, product.controller.ts, invoice.controller.ts,
                  shipment.controller.ts — request handlers
    routes/       auth.routes.ts, user.routes.ts, customer.routes.ts,
                  supplier.routes.ts, product.routes.ts, invoice.routes.ts,
                  shipment.routes.ts — wire URLs to controllers
    middleware/   auth.ts — requireAuth (verifies JWT cookie), requireAdmin (role check)
    utils/        passwordHasher.ts (bcrypt), jwt.ts (sign/verify), asyncHandler.ts
    scripts/      seedAdmin.ts — creates the admin/admin@123 account (npm run seed)
    app.ts        Express app: CORS, cookie-parser, JSON body parsing, routes, error handler
    server.ts     entry point — connects Mongoose, then starts listening
```

**Auth flow:** `POST /api/auth/register` (public — this is the brief's
required self-service "register" flow; new accounts default to `staff`),
`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. A
real `jsonwebtoken`-signed JWT (not the Next.js side's hand-rolled
token) is set as an **httpOnly cookie** rather than returned in the
response body for the frontend to store — chosen over the more
"textbook" `Authorization: Bearer` + `localStorage` pattern because it
isn't reachable from JS (safer against XSS) and mirrors what's already
built. The trade-off: it needs CORS configured with `credentials: true`
and a matching origin (`CLIENT_ORIGIN` in `.env`), and the frontend's
`fetch()` calls need `credentials: "include"`. `sameSite` is `"lax"` in
dev (works fine for same-site-different-port localhost) and would need
`"none"` + HTTPS if frontend and backend ever end up on genuinely
different domains in production.

**Users:** `GET /api/users` (any authenticated user), `POST /api/users`
(admin only, via `requireAdmin` — lets an admin provision an account
directly, alongside public `/register`). `User.passwordHash` has
`select: false` in the schema, so it's excluded from query results by
default (must opt in with `.select("+passwordHash")`, which only `login`
does) — the Mongoose-side equivalent of the Next.js `User` class's
"no public getter for the hash."

**Login timing:** same defense as the Next.js version — `login` compares
against a real bcrypt hash of an unrelated string when the username
doesn't exist, so "no such user" and "wrong password" take about the
same time.

**Master data (Customers/Suppliers/Products):** full CRUD, all behind
`requireAuth` (no public reads — unlike `/register`, there's no reason an
anonymous caller should see the customer list). Each entity follows the
same shape: a Mongoose model using the **default ObjectId `_id`** (not
the `"cust-bluepeak"`-style string ids the Next.js prototype's in-memory
repositories use — those exist only because `Entity` needed *some* id
before a real database was in the picture), a `toPublicX()` mapper that
stringifies `_id` to `id` (mirroring `toPublicUser`), and five route
handlers — `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` —
each wrapped in `asyncHandler`:

- `GET /api/customers`, `GET /api/suppliers`, `GET /api/products` — list
  (sorted oldest-first), any authenticated user.
- `GET /:id` — 404 if the id doesn't resolve to a document.
- `POST /` — validates required fields itself (matching the
  hand-rolled validation style already used in `auth.controller.ts`/
  `user.controller.ts`, rather than only relying on Mongoose schema
  errors, so a bad request gets a clear 400 message instead of a raw
  `ValidationError` dump). `Product` additionally checks for an existing
  `sku` (case-insensitive — the schema uppercases it) before creating,
  the same "check first" pattern `auth.controller.ts` uses for duplicate
  usernames, and returns 409 on conflict.
- `PUT /:id` — partial update (`$set` of only the fields present in the
  body), re-validates a changed `sku`/price/name the same way create
  does, 404 if the id doesn't resolve.
- `DELETE /:id` — 204 on success, 404 if already gone.

No entity here has anything analogous to a password hash, so — unlike
`User` — there's no `select: false` field and no risk in returning the
full document from `toPublicX()`.

**Invoices & Shipments:** `Invoice` (`orderId`, `status` — Draft/Sent/
Paid/Overdue, `issueDate`, `dueDate`) and `Shipment` (`orderId`,
`invoiceId` nullable, `status` — Draft/Packed/Dispatched/Delivered,
`date`), both `ref`-ing `Order` by ObjectId. Unlike the master-data
entities, these two don't get a `DELETE` route — an invoice or shipment
moves through its status lifecycle instead of being removed, matching
how `Order`/`Invoice`/`Shipment` work in the Next.js domain layer (see
"Encapsulation" above: status changes go through a dedicated method, not
a generic mutation). Instead of a generic status-setter route, each gets
its own intention-revealing endpoint:

- `GET /api/invoices` / `GET /api/shipments` — list, **populates
  `orderId`** so the response embeds the full order under an `order` key
  (`toPublicInvoice`/`toPublicShipment` check `document.populated("orderId")`
  and only include `order` when it's actually been populated — the same
  functions handle both the populated list response and the unpopulated
  get/create/update response without a separate mapper).
- `GET /:id`, `POST /`, `PUT /:id` — same shape as the master-data
  entities: hand-rolled validation (a valid ObjectId string for
  `orderId`/`invoiceId`, status must be one of the enum's values),
  `$set` partial updates on `PUT`.
- `PATCH /api/invoices/:id/mark-paid` — sets `status: "Paid"`, no body.
- `PATCH /api/shipments/:id/dispatch` / `.../deliver` — set
  `status: "Dispatched"` / `"Delivered"`, no body. Mirrors
  `Shipment.dispatch()`/`.deliver()` on the Next.js side.

**`Order.ts` is a placeholder, not Task 2's real Order CRUD** — worth
flagging loudly since it's easy to miss. No Order model existed anywhere
in the repo (checked every branch) when Invoices/Shipments were built,
but `ref: "Order"` + `.populate("orderId")` need *some* registered
Mongoose model to resolve against, or `.populate()` throws
`MissingSchemaError` at request time. [`Order.ts`](server/src/models/Order.ts)
is deliberately minimal (`customer`, `product`, `qty`, `price`, `status`,
`date` — mirrors the Next.js domain class's fields) and says so in its
own file comment. It uses the collection name (`"orders"`) a real Order
model would use, so whoever builds the real one can replace this file
outright without losing any data created against it in the meantime —
just double check field names line up, or migrate existing documents if
they don't. No `/api/orders` routes exist yet; that's still open. async route handlers
that throw/reject are **not** automatically forwarded to the error
middleware in Express 4 (that only became automatic in Express 5) — an
uncaught rejection would just hang the request forever instead of
returning an error. Every controller is wrapped with
[`asyncHandler`](server/src/utils/asyncHandler.ts) in the route files
specifically to catch that and call `next(err)`.

**Environment variables** ([`server/.env.example`](server/.env.example) —
copy to `server/.env`, gitignored via `server/.gitignore`):

| Variable | Where it comes from |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → your cluster → Connect → Drivers → copy the connection string, fill in your database user's username/password |
| `JWT_SECRET` | Your own — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`, never share it |
| `PORT` | Defaults to `4000` |
| `CLIENT_ORIGIN` | The Next.js app's origin (`http://localhost:3000` in dev) — CORS only accepts requests from here |

**A real DNS gotcha, worth remembering:** the standard Atlas connection
string (`mongodb+srv://cluster0.xxxxx.mongodb.net/...`) requires the
Node.js driver to resolve a DNS **SRV** record itself. On some networks —
this one included, a mobile-hotspot connection — that specific lookup
fails with `querySrv ECONNREFUSED` even though the network is otherwise
fine and a plain `nslookup -type=SRV` for the same record succeeds. The
mismatch is because Node's own SRV/TXT resolution (via c-ares) doesn't
go through the OS's regular DNS resolution path the way `nslookup` or a
browser does, and some routers/hotspots block that specific query
pattern while allowing normal lookups. The fix: use the **standard**
(non-SRV) connection string instead — `mongodb://host1,host2,host3/...`
with the individual shard hostnames, port `27017`, and
`replicaSet`/`authSource` spelled out as query params. Both pieces of
info needed to build it by hand are themselves DNS records Atlas
publishes for the `+srv` hostname: `nslookup -type=SRV
_mongodb._tcp.<cluster-host>` for the shard hostnames, and `nslookup
-type=TXT <cluster-host>` for `replicaSet`/`authSource`. Atlas's own
"Connect" dialog only ever offers the `+srv` form, so this substitution
has to be done manually if you hit this.

**Status:** verified end-to-end against a real MongoDB Atlas cluster —
`npm run seed` created the admin user, and `POST /api/auth/login`,
`GET /api/auth/me`, `GET /api/users`, and a wrong-password rejection all
confirmed working via curl with a real session cookie. The
Customer/Supplier/Product CRUD routes are verified the same way: full
create → list → get → update → delete round trips via curl with a real
session cookie against the same Atlas cluster, plus the validation edge
cases (missing required field → 400, duplicate `Product.sku` → 409,
negative price → 400, unauthenticated request → 401, unknown id → 404).
The Invoice/Shipment routes are verified the same way, including the
`populate("orderId")` list responses and the `mark-paid`/`dispatch`/
`deliver` actions, against a throwaway `Order` document created directly
through the placeholder model (no `/api/orders` route exists to create
one through yet) and deleted again afterward. Builds and typechecks
cleanly (`npm run typecheck && npm run build`), and fails fast with a
clear error if `MONGODB_URI` is missing. Not yet
wired to the Next.js frontend, which still talks to
its own in-memory auth (see the "Status" callout above "Backend" for the
cutover plan) — that's Task 5 in the current round of team work.

## Database (Supabase, V1)

The app itself still runs on the in-memory repositories described above —
this section covers the Supabase project that's being stood up alongside
it, ahead of actually wiring a `Sql*Repository` per entity. **Supabase is
explicitly a stand-in**: the plan is to move to MongoDB later, so nothing
here should end up baked into `ERPStore` or the domain layer — only into
new repository implementations, exactly as "Swapping in a real database"
above describes. That's the whole point of the `Repository<T>` interface:
the database underneath it can change (in-memory → Supabase/Postgres →
MongoDB) without the swap ever being visible above the repository layer.

**Files:**

- [`DB_V1.sql`](DB_V1.sql) — table structure. Run once in the Supabase SQL
  Editor against a fresh project. One table per repository/entity
  (`customers`, `suppliers`, `products`, `inventory_items`, `orders`,
  `incoming_order_drafts` + `incoming_order_draft_line_items`, `invoices`,
  `shipments`, `production_jobs`, `users`), plus `activity_feed` and
  `revenue_series` for the two Dashboard feeds. Every status column is
  `CHECK`-constrained to the same string union TypeScript already enforces
  (`OrderStatus`, `InvoiceStatus`, ...), and every table gets a
  `set_updated_at()` trigger and Row Level Security turned on — `users` is
  the one exception to the *permissive* policy, see below.
- [`DB_V1_Insert.sql`](DB_V1_Insert.sql) — master/demo data, ported 1:1
  from [`seed-data.ts`](src/repositories/seed-data.ts) (same ids, names,
  quantities, prices), plus the one seeded admin account (`admin` /
  `admin@123`, hashed with pgcrypto — see "Authentication & Users" above).
  Run after `DB_V1.sql`. Safe to re-run.

**Design choices carried over from the domain layer:**

- Primary keys are `TEXT` (`ORD-1036`, `INV-2039`, ...), not generated
  UUIDs — matching the ids `Entity` already assigns in `src/domain/`, so
  there's no id-mapping layer needed between rows and domain objects.
- `orders.customer` and `orders`/`production_jobs`.`product` stay plain
  `TEXT` columns rather than foreign keys into `customers`/`products`,
  because that's what the domain model does today (`Order.customer` is a
  string, not a `Customer` reference — see [`Order.ts`](src/domain/Order.ts)).
  A future version could tighten this to a real FK, but that's a domain
  model change first, a schema change second.
- **RLS posture for V1**: every table except `users` has RLS enabled with
  one permissive "allow everything to `anon` and `authenticated`" policy,
  because the app has no fine-grained authorization yet. This is
  deliberately temporary — the SQL file says so at the point where it's
  created, so it isn't missed later. `users` gets RLS enabled with **no**
  policy at all (default-deny for every role) — it holds password hashes,
  so it must only ever be reachable via the service_role key, which
  bypasses RLS entirely and therefore doesn't need a policy to work.

**Environment variables** ([`.env.example`](.env.example) — copy to `.env`,
which is gitignored):

| Variable | Where to find it |
|---|---|
| `AUTH_SECRET` | Not from Supabase — generate your own (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). Signs the app's own session tokens; see "Authentication & Users" above. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → **Data API** → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → **API Keys** → anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → **API Keys** → service_role / secret key (server-only, bypasses RLS — never expose to the browser) |
| `DATABASE_URL` | Green **Connect** button (top bar, next to the branch selector) → Connection string → **Transaction pooler** tab (port 6543 — for serverless/edge) |
| `DIRECT_DATABASE_URL` | Same **Connect** dialog → **Direct connection** tab (port 5432 — for `psql`/long-lived processes) |

Only the Supabase URL/anon/service-role keys are needed for a
`supabase-js`-based repository; the `DATABASE_URL` pair is there in case a
repository (or a migration tool) talks to Postgres directly instead. Note
Supabase's dashboard has no single "Database" settings page anymore —
connection strings live behind that `Connect` button, not under Project
Settings.

## Design tokens (Nocturne → Tailwind)

The Nocturne design system's tokens (`_ds/nocturne-.../styles.css`) were
ported as raw CSS custom properties into
[`globals.css`](src/app/globals.css) — `--color-bg`, `--color-surface`,
`--color-accent-*`, `--radius-*`, `--shadow-*`, etc. — rather than
Tailwind v4 `@theme` keys. Reason: several of Nocturne's names
(`neutral-500`, `accent-800`, ...) collide with Tailwind's own default
palette, and defining only *some* shades of a Tailwind-named scale in
`@theme` silently mixes Nocturne colors with Tailwind's defaults for the
shades you didn't override. Keeping them as plain CSS variables and
referencing them from components via Tailwind's arbitrary-value syntax
(`bg-[var(--color-surface)]`) avoids that collision entirely and is a
direct port of how the original design used `style="...var(--color-x)"`
inline everywhere.

Font: the original loaded Inter via a `@import url(fonts.googleapis...)`
in `styles.css`. We use `next/font/google` instead
([`layout.tsx`](src/app/layout.tsx)) for automatic self-hosting/subsetting,
and point `--font-heading`/`--font-body` at the variable it generates.

## Routing vs. the original single-page mockup

The original `.dc.html` was one component that swapped an internal
`screen` state variable (`isDashboard`, `isSales`, ...) to fake
navigation, and a `selectedInvoiceId` / `settingsTab` state for
"sub-screens." This repo replaces all of that with real Next.js routes:

| Original state | Route(s) here |
|---|---|
| `screen` | `/dashboard`, `/sales`, `/invoicing`, `/inventory`, `/shipments`, `/production` |
| `settingsTab` | `/settings/customers`, `/settings/suppliers`, `/settings/products`, `/settings/users` (nested layout at `src/app/(app)/settings/layout.tsx`) |
| *(new — not in the original design)* | `/login` |

This means settings tabs are shareable/bookmarkable URLs, and `ERPStore`
doesn't need to track "current screen" as state at all — the URL is the
state. Invoice detail *used* to be a route too
(`/invoicing/[invoiceId]`) but was later replaced by a popup — see
"Record detail popups" below — for consistency with Sales, Shipments and
Production, none of which ever had a detail route.

Every one of those routes now lives inside an `(app)` route group
(`src/app/(app)/...`) rather than directly under `src/app/`. Route groups
don't affect the URL — `(app)/dashboard/page.tsx` still serves `/dashboard`
— they only let a subtree share a layout that other routes opt out of.
That's exactly what `/login` needs: it must render *without* the
Sidebar/ERPStoreProvider shell, so the shell moved from the root layout
into `(app)/layout.tsx`, and the true root layout
([`layout.tsx`](src/app/layout.tsx)) is now just `<html>`/`<body>` + fonts.
See "Authentication & Users" below for how that layout also reads the
signed-in user server-side.

The **sidebar** ([`Sidebar.tsx`](src/components/layout/Sidebar.tsx)) is
mounted once in `(app)/layout.tsx` and owns its own collapsed/expanded
`useState` — that state is UI-only, not domain data, so it doesn't
belong in `ERPStore`. Because that layout doesn't remount between route
changes within `(app)`, it survives navigation anyway.

## Record detail popups (view/edit)

Clicking any Order (board card or table row), Invoice, Shipment, or
Production job opens a popup — [`RecordDialog`](src/components/ui/RecordDialog.tsx)
— showing that record's fields, with an **Edit** button that only
appears when the record is still editable:

| Screen | Detail dialog | Editable when |
|---|---|---|
| Sales | [`OrderDetailDialog`](src/components/sales/OrderDetailDialog.tsx) | `order.status === "Draft"` |
| Invoicing | [`InvoiceDetailDialog`](src/components/invoicing/InvoiceDetailDialog.tsx) | `invoice.status === "Draft"` |
| Shipments | [`ShipmentDetailDialog`](src/components/shipments/ShipmentDetailDialog.tsx) | `shipment.status === "Draft"` |
| Production | [`JobDetailDialog`](src/components/production/JobDetailDialog.tsx) | `job.status === "Planned"` |

Each `*DetailDialog` is a thin composition of `RecordDialog`: it holds
its own `useState` for the staged edit-form values (reset on Cancel,
committed via the store's `update*` action on Save), and passes a
`children(mode)` render prop that switches between read-only
[`RecordRow`](src/components/ui/RecordDialog.tsx)s and `Field`/`Input`
form controls. `RecordDialog` itself never imports a domain type — it
only needs `editable: boolean` and a `statusBadge` node — which is what
makes it reusable across four otherwise-unrelated entities. The
"editable" boolean is never trusted from the UI alone: each entity's own
`update()` method re-checks `canEdit` and no-ops if the status has moved
on (see "Encapsulation" above), so a stale-open dialog can't write past a
status change that happened elsewhere.

Order editing intentionally covers every mutable field (customer,
product, qty, price, date) since none of it is downstream-referenced
until Confirmed. Invoice and Shipment editing is narrower (dates only) —
their `orderId`/`invoiceId` links are identifiers set by the workflow
that created them, not free text a user should retype.

## Deliberate differences from the static mockup

The original `.dc.html` is a mockup: some numbers were literal text in
the template, not derived from `state`. Turning it into a working app
meant making a few of these real:

- **Dashboard stat tiles** (Pending Orders / In Production / Shipments
  Today / Low Stock) were hardcoded `5`, `4`, `2`, `3` in the template.
  They're now computed in `ERPStore` (`pendingOrdersCount`, etc.) from
  the actual order/job/shipment/inventory collections.
- **Revenue chart** was a hand-drawn static SVG path. It's now driven by
  [`RevenueChart.tsx`](src/components/dashboard/RevenueChart.tsx) reading
  `ERPStore.revenueSeries` (seeded data), scaled dynamically.
- **"New Order" approval**: in the mockup, clicking "Approve & create
  order" just closed the panel — it didn't actually add anything to the
  order list. Here, [`IncomingOrderDraft.toOrder()`](src/domain/IncomingOrderDraft.ts)
  really creates an `Order` and `ERPStore.approveIncomingDraft()` adds it
  to the order book, because leaving that as a no-op would make the
  Sales workflow feel broken in a real app.
- **Sidebar collapse**: the mockup exposed `sidebarCollapsed` only as a
  design-tool preview prop, with no actual toggle control. There's now a
  real collapse button, since the CSS already had a width transition
  clearly meant for this.

Buttons the mockup drew but never wired to logic (New Invoice, Adjust
stock, New Shipment, New Job, Add supplier, Add product, Send reminder,
Download PDF) are intentionally left as visual stubs — implementing
them needs domain rules (e.g. "what makes a valid shipment?") that
weren't specified. `Mark as paid` and `Add customer` *are* wired, as
worked examples of the same pattern.

## Build log

1. **Imported the design** via the `claude_design` MCP (`DesignSync`
   tool): read `FlowERP Dashboard.dc.html`, `_ds/nocturne-.../styles.css`,
   `_ds/nocturne-.../_ds_bundle.js` (empty — no pre-built components to
   reuse), and `support.js` (the `.dc.html` preview runtime — not
   something the real app needs, since Next.js replaces it).
2. **Scaffolded Next.js** (`create-next-app`, TypeScript + Tailwind v4 +
   App Router + `src/` dir + `@/*` import alias), then moved the
   generated files up into the repo root (had to scaffold into a temp
   subfolder first — npm rejects package names with capital letters, and
   the repo directory name has them).
3. **Ported design tokens** into `globals.css` as CSS custom properties
   (see "Design tokens" above), plus the heading type scale.
4. **Built the domain layer** (`src/domain/`): `Entity`, `Money`,
   `StatusBadge` (palette + `Statusable` interface + `StatusfulEntity`
   base), then `Customer`, `Supplier`, `Product`, `Order`, `Invoice`,
   `Shipment`, `ProductionJob`, `InventoryItem`, `IncomingOrderDraft`.
5. **Built the repository layer** (`src/repositories/`): `Repository<T>`
   interface + `InMemoryRepository<T>` base, one repository per entity,
   and `seed-data.ts` ported from the original `state = {...}` block.
6. **Built the store** (`src/store/`): `Observable` base class,
   `ERPStore` (composes repositories, exposes read/query/action methods),
   `ERPStoreProvider` (React context, one instance for the app's
   lifetime) and `useERPStore` (the `useSyncExternalStore` bridge). Hit
   and fixed a real bug here: the first version of `useERPStore` passed
   the same store instance as the snapshot on every call, so React's
   `Object.is` check saw "no change" and skipped re-renders after
   mutations — fixed by adding a `version` counter to `Observable` that
   `notify()` increments, and using that as the snapshot instead.
7. **Built shared UI components** (`src/components/ui/`): `Button` /
   `LinkButton`, `Card`, `Tag` / `StatusTag`, `Table<T>` (generic,
   column-driven), `Dialog`, `SegmentedControl<T>`, `Input` / `Field` —
   all styled with Tailwind arbitrary-value classes against the ported
   CSS variables.
8. **Built layout**: `Sidebar` (icons ported 1:1 from the original inline
   SVGs, active-route highlighting via `usePathname()`, self-contained
   collapse state), `PageHeader`.
9. **Built each feature area** and its route(s): Dashboard (stat cards,
   `RevenueChart`, `ActivityFeed`), Sales (`OrderBoard` drag-and-drop
   Kanban using the native HTML5 DnD API, `OrderTable`, `NewOrderDrawer`
   for the incoming-draft review flow, plus a working search filter that
   the original mockup's search box didn't have), Invoicing (list +
   detail, originally a `/invoicing/[invoiceId]` route — see step 12),
   Inventory (stock table with reorder progress bars), Shipments (table),
   Production (three-column board with per-job progress on "In Progress"
   jobs), Settings (nested customers/suppliers/products routes sharing
   one tab-switcher layout, plus `AddCustomerDialog`).
10. **Typechecked and built** (`tsc --noEmit`, `next build`) — clean on
    the first full build after fixing the `useSyncExternalStore` snapshot
    bug (`getServerSnapshot` was also missing, which broke static
    prerendering of `/dashboard`; fixed by passing the same snapshot
    function as the third argument).
11. **Verified in a real browser** (Playwright driving the dev server,
    since `chromium-cli` wasn't available in this environment): walked
    every route, dragged a Kanban card, opened/edited/approved the New
    Order drawer, opened an invoice detail page, added a customer and
    confirmed it appeared live in the table, collapsed the sidebar.
    Zero console/page errors across the whole pass.
12. **Added record detail popups with status-gated editing** (see "Record
    detail popups" above): built `RecordDialog` + `RecordRow` as the one
    reusable popup shell, added `canEdit`/`update()` to `Order`,
    `Invoice`, `Shipment`, `ProductionJob` (converting their editable
    fields from public `readonly` to private-with-getter, which is
    transparent to every existing call site since getters read the same
    way), added matching `update*` actions to `ERPStore`, then wired a
    `*DetailDialog` into each of Sales (board card + table row),
    Invoicing, Shipments and Production. Retired the
    `/invoicing/[invoiceId]` route and its `InvoiceDetail` component in
    favor of the popup, for consistency with the other three screens
    (none of which had ever had a detail route). Verified with a
    CDP-driven headless Chrome session (no Playwright install in this
    environment): opened a Draft order, edited customer/qty, saved, and
    confirmed the new values and recalculated amount appeared in both the
    dialog and the Kanban card behind it; confirmed the Edit button is
    absent for a Confirmed order, a Sent invoice, and an In Progress job.
13. **Stood up the Supabase database (V1)**, ahead of writing any
    `Sql*Repository` classes: [`DB_V1.sql`](DB_V1.sql) (table structure —
    one table per repository, status `CHECK` constraints matching the
    TypeScript unions, `updated_at` triggers, RLS enabled with a
    temporary permissive policy) and [`DB_V1_Insert.sql`](DB_V1_Insert.sql)
    (master/demo data ported 1:1 from `seed-data.ts`). Added
    [`.env.example`](.env.example) documenting every Supabase credential
    and where to find it in the dashboard, and a local `.env` (gitignored)
    for actual values. See "Database (Supabase, V1)" above. The app's
    repositories are still in-memory — this is prep, not a swap yet — and
    Supabase itself is a placeholder ahead of an eventual move to MongoDB,
    which is exactly the swap `Repository<T>` was designed to absorb
    without touching `ERPStore` or any component.
14. **Built custom authentication and a Users admin tab** (see
    "Authentication & Users" above): `User` domain entity, server-only
    `PasswordHasher`/`token.ts`/`session.ts` under `src/server/auth/`,
    `UserRepository` (seeded with `admin`/`admin@123`), the
    `/api/auth/login`, `/api/auth/logout` and `/api/users` routes,
    [`src/proxy.ts`](src/proxy.ts) for route protection (built as
    `middleware.ts` first, then migrated to Next.js 16's renamed `proxy`
    convention via the official codemod), a `/login` page, and
    `/settings/users`. Restructured every existing route from `src/app/`
    into an `(app)` route group so `/login` could render without the
    Sidebar shell — see "Routing" above. Hit and fixed a real bug here
    too: `UserRepository`'s plain module-level singleton wasn't actually
    shared between the `/api/users` Route Handler and the
    `settings/users` Server Component under Turbopack dev — a created
    user was invisible on the very next full page load. Fixed by
    anchoring the singleton on `globalThis` instead (see the "real bug"
    callout above). Verified with Playwright: unauthenticated access to
    `/dashboard` redirects to `/login?next=/dashboard`; a wrong password
    shows an inline error and stays on the login page; a correct login
    lands on `/dashboard` with the Sidebar showing the real signed-in
    user (not a hardcoded name); `/settings/users` lists the seeded admin,
    adding a user immediately shows up in the table, and logging out
    redirects to `/login` and re-locks every protected route.
15. **Scaffolded the real Express + Mongoose backend** (`/server`) to
    match the course brief's mandated stack literally — see "Backend
    (Express + Mongoose)" above for the full rationale and layout.
    Routes/controllers/models/middleware structure, JWT-in-httpOnly-cookie
    auth (register/login/logout/me), bcrypt password hashing, a Mongoose
    `User` model with `passwordHash` excluded from queries by default, an
    admin-seed script, and CORS wired for the Next.js frontend's origin.
    Hit and fixed a real Express 4 gotcha: async controllers that reject
    aren't automatically forwarded to error-handling middleware (that's
    an Express 5 behavior) — wrapped every one in `asyncHandler` so
    thrown/rejected errors actually reach the centralized handler instead
    of hanging the request. Verified the server builds and typechecks
    cleanly, and fails fast with a clear message when `MONGODB_URI` is
    missing. Not yet connected to a real MongoDB (no Atlas cluster
    provisioned yet) or wired to the frontend — that's the next step
    once a `MONGODB_URI` is available.
16. **Built full CRUD for the master-data entities** (Customer, Supplier,
    Product — see "Master data" above) once a real `MONGODB_URI` was
    available, mirroring `auth.controller.ts`/`user.controller.ts`'s
    hand-rolled-validation style rather than introducing a generic
    CRUD-factory abstraction, to stay consistent with this backend's
    deliberately plain Express/MVC conventions. Every route requires
    `requireAuth`; `Product` additionally enforces a unique `sku` with a
    "check first" `findOne` (same pattern `auth.controller.ts` uses for
    duplicate usernames) rather than relying on a caught duplicate-key
    error. Mounted all three routers in `app.ts` next to `userRouter`.
    Verified against the real MongoDB Atlas cluster with curl (not just
    `tsc`/`next build` passing): logged in for a session cookie, then for
    each entity ran create → list → getById → update → delete, plus the
    edge cases — missing required field (400), `Product` duplicate `sku`
    (409), negative price (400), unauthenticated request (401), unknown
    id (404) — all deleted the test records afterward so nothing test-only
    was left in the shared Atlas cluster. `npm run typecheck` and
    `npm run build` both clean.
17. **Built Invoice and Shipment CRUD** (see "Invoices & Shipments"
    above), the same day as step 16 and in the same style. Discovered
    partway through that no `Order` model existed anywhere in the repo
    yet (checked every branch — Task 2 hadn't landed), which meant
    `ref: "Order"` + `.populate("orderId")` had nothing to resolve
    against. Added a deliberately minimal, clearly-commented placeholder
    [`Order.ts`](server/src/models/Order.ts) rather than either leaving
    `.populate()` broken or skipping verification — same collection name
    a real Order model would use, so it's a drop-in replacement later.
    Gave Invoice/Shipment intention-revealing status actions
    (`mark-paid`, `dispatch`, `deliver`) instead of a generic PATCH
    status route, and deliberately left out `DELETE` for both (not in
    the spec — invoices/shipments move through their lifecycle instead
    of being removed, same as the Next.js domain layer). Verified against
    the real Atlas cluster: created a throwaway `Order` via a one-off
    `tsx` script (no `/api/orders` route exists to create one through),
    then ran full create/list/get/update/mark-paid for Invoice and
    create/list/get/update/dispatch/deliver for Shipment via curl with a
    real session cookie, confirmed `populate("orderId")` actually embeds
    the order on the list routes and only the list routes, and deleted
    all test documents (including the throwaway order) afterward. `npm
    run typecheck` and `npm run build` both clean.

## Running it

**Frontend (Next.js):**

```bash
npm install
npm run dev     # http://localhost:3000 → redirects to /login, then /dashboard once signed in
npm run build   # production build + typecheck
```

Requires `AUTH_SECRET` at minimum (signs the Next.js side's session
tokens — generate your own, see `.env.example`). Default login:
**admin / admin@123**. The Supabase variables aren't required yet — every
repository (including `UserRepository`) is still in-memory. A Supabase
project's schema/seed data exists (`DB_V1.sql`, `DB_V1_Insert.sql`) ahead
of actually wiring it up — see "Database (Supabase, V1)" and "Swapping in
a real database" above for how that connects once a `Sql*Repository` is
written.

**Backend (Express + Mongoose):**

```bash
cd server
npm install
cp .env.example .env   # then fill in MONGODB_URI (see "Backend" above) — JWT_SECRET/PORT/CLIENT_ORIGIN already have working defaults
npm run seed            # creates the admin/admin@123 account
npm run dev              # http://localhost:4000
npm run build             # compiles to dist/; npm start runs the compiled output
```

The two apps are currently independent — the Next.js frontend doesn't
call `/server` yet. See the "Status" note under "Authentication & Users"
above for the cutover plan once `/server` is verified working.
