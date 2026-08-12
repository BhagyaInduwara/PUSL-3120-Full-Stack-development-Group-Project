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

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4.
**Requirement driving the architecture:** strict OOP, components-based,
ready to swap in a real database/API later without touching the UI.

## Architecture at a glance

```
src/
  domain/          Entity classes — identity + behavior, no React, no fetch
  repositories/     Data access — one interface, swappable implementations
  store/            ERPStore — the app's state, framework-agnostic
  components/       Presentational React components, grouped by feature
  app/              Next.js routes — thin: fetch from the store, render components
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

Every repository (`src/repositories/*.ts`) implements the
[`Repository<T>`](src/repositories/Repository.ts) interface and is
currently backed by `InMemoryRepository`, seeded from
[`seed-data.ts`](src/repositories/seed-data.ts) (ported 1:1 from the
`state = {...}` block in the original `.dc.html`). When the real
database/API is available:

1. Write one new class per entity that implements `Repository<T>` (e.g.
   `SqlOrderRepository implements Repository<Order>`), calling your
   API/DB client instead of touching an array.
2. Swap the `new OrderRepository()` (etc.) lines in
   [`ERPStore`](src/store/ERPStore.ts)'s field initializers for the new
   classes — probably via constructor injection at that point, so
   `ERPStoreProvider` can pass in real clients.
3. Nothing in `components/` or `app/` changes, because they only ever
   called `ERPStore` methods, never a repository directly.

Repository mutation methods that are currently synchronous (`add`,
`moveStatus`, `markPaid`, ...) will need to become `async` once they're
real network calls — that ripples into `ERPStore`'s action methods and
the components that call them (e.g. `onClick={() => store.markInvoicePaid(id)}`
becomes an awaited call with loading state), but the shape of the
architecture doesn't change.

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
  `shipments`, `production_jobs`), plus `activity_feed` and
  `revenue_series` for the two Dashboard feeds. Every status column is
  `CHECK`-constrained to the same string union TypeScript already enforces
  (`OrderStatus`, `InvoiceStatus`, ...), and every table gets a
  `set_updated_at()` trigger and Row Level Security turned on.
- [`DB_V1_Insert.sql`](DB_V1_Insert.sql) — master/demo data, ported 1:1
  from [`seed-data.ts`](src/repositories/seed-data.ts) (same ids, names,
  quantities, prices). Run after `DB_V1.sql`. Safe to re-run.

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
- **RLS posture for V1**: every table has RLS enabled with one permissive
  "allow everything to `anon` and `authenticated`" policy, because the app
  has no login/auth system yet. This is deliberately temporary — the SQL
  file says so at the point where it's created, so it isn't missed later.

**Environment variables** ([`.env.example`](.env.example) — copy to `.env`,
which is gitignored):

| Variable | Where to find it in Supabase |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → Data API → **anon / public** key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → Data API → **service_role / secret** key (server-only, bypasses RLS — never expose to the browser) |
| `DATABASE_URL` | Project Settings → Database → **Connection string** → Connection pooling tab (port 6543 — for serverless/edge) |
| `DIRECT_DATABASE_URL` | Project Settings → Database → **Connection string** → Direct connection tab (port 5432 — for `psql`/long-lived processes) |

Only the first two are needed for a `supabase-js`-based repository; the
`DATABASE_URL` pair is there in case a repository (or a migration tool)
talks to Postgres directly instead.

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
| `settingsTab` | `/settings/customers`, `/settings/suppliers`, `/settings/products` (nested layout at `src/app/settings/layout.tsx`) |

This means settings tabs are shareable/bookmarkable URLs, and `ERPStore`
doesn't need to track "current screen" as state at all — the URL is the
state. Invoice detail *used* to be a route too
(`/invoicing/[invoiceId]`) but was later replaced by a popup — see
"Record detail popups" below — for consistency with Sales, Shipments and
Production, none of which ever had a detail route.

The **sidebar** ([`Sidebar.tsx`](src/components/layout/Sidebar.tsx)) is
mounted once in the root layout and owns its own collapsed/expanded
`useState` — that state is UI-only, not domain data, so it doesn't
belong in `ERPStore`. Because the root layout doesn't remount between
route changes, it survives navigation anyway.

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

## Running it

```bash
npm install
npm run dev     # http://localhost:3000 → redirects to /dashboard
npm run build   # production build + typecheck
```

No environment variables or external services are required yet — every
repository is in-memory. A Supabase project's schema/seed data exists
(`DB_V1.sql`, `DB_V1_Insert.sql`, `.env.example`) ahead of actually wiring
it up — see "Database (Supabase, V1)" and "Swapping in a real database"
above for how that connects once a `Sql*Repository` is written.
