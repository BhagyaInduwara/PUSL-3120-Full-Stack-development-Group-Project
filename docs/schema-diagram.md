# FlowERP Backend — Connection & Auth Schema

Scope: the Express + Mongoose backend (`/server`). Covers how it connects to
MongoDB and how user identity/session data is shaped and secured. See the
root [`CLAUDE.md`](../CLAUDE.md) for the rest of the architecture (domain
layer, repositories, frontend routing) — this file only goes deep on the two
pieces called out for M3 sign-off: the core connection and the user security
schema.

## 1. Core Connection Architecture

**Files:** [`server/src/config/env.ts`](../server/src/config/env.ts),
[`server/src/config/db.ts`](../server/src/config/db.ts),
[`server/src/server.ts`](../server/src/server.ts) (long-running entry point),
[`server/api/index.ts`](../server/api/index.ts) (serverless entry point).

```mermaid
flowchart TD
    ENV["env.ts<br/>required(name) fails fast if<br/>MONGODB_URI / JWT_SECRET missing"] --> DB

    subgraph DB["db.ts — connectDB()"]
        CHECK{"connectionPromise<br/>already set?"}
        CHECK -- "no" --> CONNECT["mongoose.connect(uri, {<br/>maxPoolSize: 10,<br/>minPoolSize: 1,<br/>serverSelectionTimeoutMS: 10s })"]
        CONNECT --> CACHE["cache the Promise itself<br/>(module-level variable)"]
        CHECK -- "yes" --> AWAIT
        CACHE --> AWAIT["await the cached promise"]
    end

    subgraph ENTRY["Two entry points, one connectDB()"]
        SERVER["server.ts<br/>(local dev / Render / Railway)<br/>calls connectDB() once at boot,<br/>then app.listen()"]
        API["api/index.ts<br/>(Vercel serverless handler)<br/>calls connectDB() on EVERY<br/>invocation"]
    end

    SERVER --> DB
    API --> DB
    DB --> MONGO[("MongoDB Atlas<br/>replica set")]
```

**Why the promise (not just a connection object) is cached:** a serverless
handler runs on every request, so `connectDB()` is called far more often
than once. Caching the `Promise<typeof mongoose>` — not only the resolved
connection — means a burst of concurrent requests arriving while the first
connection is still being established all await the *same* in-flight
connect, instead of racing to open several. A cold container opens one
connection; a warm container reuses it for free. Without this, a naive
"connect on every request" implementation would exhaust Atlas's connection
limit almost immediately under any real concurrency.

**Pool sizing rationale:** `maxPoolSize: 10` keeps any single warm container
well under Atlas's free/shared-tier connection ceiling even when several
containers are warm at once; `minPoolSize: 1` avoids paying a fresh-TCP+TLS
handshake on the first request after a quiet period.
`serverSelectionTimeoutMS: 10_000` turns a misconfigured/unreachable
`MONGODB_URI` into a clear timeout error within 10s instead of a request
that hangs indefinitely.

**Fail-fast env validation:** `env.ts` is the *only* file allowed to touch
`process.env` directly (see its own header comment) — every required
variable is read through `required(name)`, which throws immediately at
import time if it's missing. This means a missing `MONGODB_URI` or
`JWT_SECRET` crashes the process at startup with a message telling you to
copy `.env.example`, rather than surfacing as an opaque error the first time
a route handler happens to touch the database or sign a token.

## 2. User Security Schema

**Files:** [`server/src/models/User.ts`](../server/src/models/User.ts)
(schema), [`server/src/controllers/auth.controller.ts`](../server/src/controllers/auth.controller.ts)
(register/login/logout/me),
[`server/src/utils/passwordHasher.ts`](../server/src/utils/passwordHasher.ts)
(bcrypt), [`server/src/utils/jwt.ts`](../server/src/utils/jwt.ts) (sign/verify),
[`server/src/middleware/auth.ts`](../server/src/middleware/auth.ts)
(`requireAuth`, `requireAdmin`).

### 2.1 `User` collection schema

| Field | Type | Constraints |
|---|---|---|
| `_id` | ObjectId | default Mongo id (not a custom string id — see `CLAUDE.md` "Master data") |
| `username` | String | `required`, `unique`, `trim`, `lowercase`, `minlength: 3` |
| `passwordHash` | String | `required`, **`select: false`** — excluded from every query result unless a call explicitly opts in with `.select("+passwordHash")` |
| `role` | String enum | `"admin" \| "staff"`, `default: "staff"` |
| `createdAt` / `updatedAt` | Date | from `{ timestamps: true }` |

`select: false` is the schema-level guarantee that a password hash can never
leak through an ordinary `User.find()`/`findById()` — the *only* place in
the whole backend that adds `.select("+passwordHash")` is `login()`, right
where it's needed to compare a submitted password. Every response ever sent
to a client goes through `toPublicUser()`, which reads only
`{ id, username, role, createdAt }` off the document — structurally
incapable of including the hash, the same encapsulation pattern the
Next.js-side `User` domain class used before decommissioning (see §3).

### 2.2 Request → response flow

```mermaid
sequenceDiagram
    participant Browser
    participant NextProxy as Next.js route<br/>(/api/auth/*, same-origin)
    participant Express as Express backend<br/>(auth.controller.ts)
    participant Mongo as MongoDB (User collection)

    Browser->>NextProxy: POST /api/auth/login<br/>{ username, password }
    NextProxy->>Express: POST /api/auth/login (server-to-server)
    Express->>Mongo: User.findOne({username}).select("+passwordHash")
    Mongo-->>Express: document (or null)
    Note over Express: bcrypt.compare(password, hash ?? DUMMY_HASH)<br/>— constant-time-ish even for "no such user"
    alt valid credentials
        Express->>Express: signToken({sub, username, role}) — jsonwebtoken, HS256, 7d
        Express-->>NextProxy: 200 + Set-Cookie: flowerp_token=...<br/>+ { user: toPublicUser(doc) }
        NextProxy->>NextProxy: re-sets flowerp_token as its OWN<br/>httpOnly cookie (frontend's origin)
        NextProxy-->>Browser: 200 { user }, Set-Cookie (same-origin)
    else invalid
        Express-->>NextProxy: 401 { error }
        NextProxy-->>Browser: 401 { error }
    end
```

**Why the cookie gets re-set by the Next.js route instead of passed through
untouched:** the browser only ever talks to the frontend's own origin.
Setting a cookie on the *backend's* origin directly (a true cross-origin
`fetch`) is silently dropped by modern browsers' third-party-cookie
blocking regardless of `SameSite`/`Secure` configuration — see
[`src/app/api/[...path]/route.ts`](../src/app/api/%5B...path%5D/route.ts)'s
own comment for the full story. So every client-side call, auth included,
goes through a same-origin Next.js route that forwards to Express
server-to-server and re-issues the identical JWT as a same-origin cookie.
Both sides sign/verify with the same `JWT_SECRET` and the same
`flowerp_token` cookie name, so the token itself is unchanged — only which
origin's cookie jar holds it changes.

### 2.3 Authorization checks

```mermaid
flowchart LR
    REQ["Incoming request<br/>with flowerp_token cookie"] --> RA{"requireAuth"}
    RA -- "no/invalid/expired token" --> R401["401 Not authenticated"]
    RA -- "verifyToken() ok" --> ATTACH["req.user = { sub, username, role }"]
    ATTACH --> ROUTE{"route needs admin?"}
    ROUTE -- "no" --> HANDLER["controller runs<br/>(e.g. GET /api/users)"]
    ROUTE -- "yes" --> RADMIN{"requireAdmin<br/>req.user.role === 'admin'?"}
    RADMIN -- "no" --> R403["403 Admin access required"]
    RADMIN -- "yes" --> HANDLER2["controller runs<br/>(e.g. POST /api/users)"]
```

`requireAuth` verifies the JWT's signature/expiry via `jsonwebtoken.verify`
against `env.jwtSecret` — it never touches MongoDB, so an authorization
check costs one HMAC verification, not a database round trip. `requireAdmin`
only ever runs after `requireAuth` and reads the role straight off the
already-verified token claims. Role changes therefore take effect on that
user's *next login*, not instantly — the trade-off documented for the
Next.js prototype's hand-rolled tokens in `CLAUDE.md` applies identically
here: no server-side session store means no way to revoke or upgrade a role
mid-session, acceptable for this project's scale.

### 2.4 Timing-safe login

`login()` always calls `bcrypt.compare()` — against the real hash if the
user exists, against a fixed dummy bcrypt hash (`DUMMY_HASH`) if they don't
— before ever returning 401. Skipping the compare on a missing user would
make "no such user" measurably faster than "wrong password," which is
enough of a timing signal to enumerate valid usernames; always paying the
bcrypt cost closes that gap.

## 3. Decommissioned: Next.js in-memory `UserRepository`

Earlier in this project, `src/repositories/UserRepository.ts` and
`src/repositories/user-seed-data.ts` held an in-memory, array-backed `User`
store used by the Next.js app's own prototype auth routes, built to
validate the auth *design* (session tokens, `canEdit`-style encapsulation,
route protection) ahead of the mandated Express/Mongoose backend existing.

That cutover is now complete: every Next.js auth/user route
(`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`,
`/api/users`, `/api/users/[id]`, and the `settings/users` Server Component)
proxies to this Express backend server-to-server rather than reading its
own array, and the Next.js and Express sides share one JWT format (standard
3-part HS256, same `JWT_SECRET`, same `flowerp_token` cookie name) so a
token signed by either side verifies on the other. With nothing left
importing them, `UserRepository.ts`, `user-seed-data.ts`, and the Next.js
side's now-unused `PasswordHasher.ts` (bcrypt wrapper — password hashing
happens exclusively in MongoDB-land now, via
`server/src/utils/passwordHasher.ts`) were deleted. Auth and role checks
are 100% MongoDB-backed, per §2 above.
# FlowERP — Master Database Architecture & System-Wide ERD

> **Scope:** Consolidated system-wide Entity-Relationship Diagram (ERD) and technical schema specifications for all 12 MongoDB/Mongoose models (13 collections) across FlowERP. All models automatically include `_id: ObjectId` and `{ timestamps: true }` (`createdAt`, `updatedAt`) unless noted otherwise.

---

## 1. System-Wide Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User {
        ObjectId _id PK
        string username UK
        string passwordHash
        string role
    }
    Customer {
        ObjectId _id PK
        string name
        string contact
        string email
        string city
    }
    Supplier {
        ObjectId _id PK
        string name
        string category
        string contact
        string leadTime
    }
    Product {
        ObjectId _id PK
        string sku UK
        string name
        string category
        number price
    }
    InventoryItem {
        ObjectId _id PK
        string sku UK
        string name
        string category
        number qty
        number reorderPoint
    }
    Order {
        ObjectId _id PK
        string number UK
        string customer
        string status
        date date
        number amount "virtual"
    }
    OrderLineItem {
        ObjectId _id PK
        string product
        number qty
        number price
    }
    IncomingOrderDraft {
        ObjectId _id PK
        string customer
        string emailSubject
    }
    DraftLineItem {
        ObjectId _id PK
        string product
        number qty
        number price
    }
    Invoice {
        ObjectId _id PK
        string number UK
        ObjectId orderId FK
        string status
        date issueDate
        date dueDate
    }
    Shipment {
        ObjectId _id PK
        string number UK
        ObjectId orderId FK
        ObjectId invoiceId FK
        string status
        date date
    }
    ProductionJob {
        ObjectId _id PK
        string number UK
        string orderNumber
        string customer
        string product
        number qty
        date due
        string status
        number progress
    }
    Counter {
        ObjectId _id PK
        string key UK
        number seq
    }
    ActivityFeedEntry {
        ObjectId _id PK
        string message
        date occurredAt
    }
    RevenueSeriesPoint {
        ObjectId _id PK
        string week
        number revenue
        number orders
        number sortOrder
    }

    Order ||--|{ OrderLineItem : "embeds lineItems"
    IncomingOrderDraft ||--|{ DraftLineItem : "embeds lineItems"
    Invoice }o--|| Order : "references orderId (ObjectId)"
    Shipment }o--|| Order : "references orderId (ObjectId)"
    Shipment }o--o| Invoice : "optional invoiceId (ObjectId)"
    ProductionJob }o--o| Order : "Make-to-Order link (orderNumber)"
    Product ||--|| InventoryItem : "corresponds by sku"
    Counter ||..o{ Order : "generates ORD numbers"
    Counter ||..o{ Invoice : "generates INV numbers"
    Counter ||..o{ Shipment : "generates SHP numbers"
    Counter ||..o{ ProductionJob : "generates JOB numbers"
```

---

## 2. Relationships & Reference Matrix

| Source Entity | Target Entity | Relationship Type | Key / Mechanism | Behavior & Notes |
|---|---|---|---|---|
| `Order` | `OrderLineItem` | **1 : N (Embedded)** | Embedded subdocuments array | Line items have no independent existence; validated with at least 1 item. |
| `IncomingOrderDraft` | `DraftLineItem` | **1 : N (Embedded)** | Embedded subdocuments array | Permissive schema for unverified inbound email parsing. |
| `Invoice` | `Order` | **N : 1 (Reference)** | `orderId: ObjectId` (`ref: "Order"`) | Hydrated on read via Mongoose `.populate("orderId")`. |
| `Shipment` | `Order` | **N : 1 (Reference)** | `orderId: ObjectId` (`ref: "Order"`) | Associates freight manifests with the source sales order. |
| `Shipment` | `Invoice` | **N : 1 (Reference)** | `invoiceId: ObjectId` (`ref: "Invoice"`) | Optional reference (`default: null`); tracks commercial invoice pairing. |
| `ProductionJob` | `Order` | **N : 1 (Business Link)** | `orderNumber: String` | String reference supporting Make-to-Order traceability from shop floor to order. |
| `Product` | `InventoryItem` | **1 : 1 (Business Link)** | `sku: String` | Matches catalog product with warehouse physical bin stock. |
| `Counter` | `Order`, `Invoice`, `Shipment`, `Job` | **1 : N (Sequence Generator)** | `key: String` (e.g. `"order:2026"`) | Atomic `$inc` via `findOneAndUpdate` ensuring gapless, collision-free numbers. |

---

## 3. Schema Specifications by Domain

### 3.1 Auth & Access Control
* **`User`** (`server/src/models/User.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `username` | `String` | Required, unique, trimmed, lowercase, minlength: 3. |
  | `passwordHash` | `String` | Required, `select: false` (hidden from default queries). |
  | `role` | `String` | Enum: `["admin", "staff"]`, default: `"staff"`. |

---

### 3.2 Master Data & Warehouse
* **`Product`** (`server/src/models/Product.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `sku` | `String` | Required, unique, trimmed, uppercase (e.g. `"CHAIR-001"`). |
  | `name` | `String` | Required, trimmed commercial item name. |
  | `category` | `String` | Trimmed category grouping (`Seating`, `Storage`, `Desks`, `Tables`). |
  | `price` | `Number` | Required, `min: 0` (USD unit selling price). |

* **`InventoryItem`** (`server/src/models/InventoryItem.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `sku` | `String` | Required, unique; corresponds to `Product.sku`. |
  | `name` | `String` | Required inventory item name. |
  | `category` | `String` | Optional category classification. |
  | `qty` | `Number` | Required, `min: 0` (current physical stock count). |
  | `reorderPoint` | `Number` | Required, `min: 0` (threshold flagging low stock). |

* **`Customer`** (`server/src/models/Customer.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `name` | `String` | Required, trimmed company or individual name. |
  | `contact` | `String` | Trimmed primary contact person. |
  | `email` | `String` | Trimmed email address. |
  | `city` | `String` | Trimmed location city. |

* **`Supplier`** (`server/src/models/Supplier.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `name` | `String` | Required, trimmed vendor business name. |
  | `category` | `String` | Trimmed supply category (`Hardware`, `Wood`, `Textiles`). |
  | `contact` | `String` | Trimmed phone / email contact. |
  | `leadTime` | `String` | Trimmed standard delivery lead time (e.g. `"2 weeks"`). |

---

### 3.3 Sales Pipeline & Order Intake
* **`Order`** (`server/src/models/Order.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `number` | `String` | Required, unique, immutable display ID (`ORD-YYYY/MM/DD/AXXX`). |
  | `customer` | `String` | Trimmed customer name. |
  | `lineItems` | `[OrderLineItem]` | Embedded array; custom validator requires at least 1 item. |
  | `status` | `String` | Enum: `["Draft", "Confirmed", "Invoiced", "Shipped", "Closed"]`, default: `"Draft"`. |
  | `date` | `Date` | Required order placement date. |
  | `amount` | `Number` *(virtual)* | Computed on read via `Σ (qty × price)`. Not stored in DB. |

  * **`OrderLineItem`** (Embedded): `product` (string, trimmed), `qty` (number, required, min: 1), `price` (number, required, min: 0).

* **`IncomingOrderDraft`** (`server/src/models/IncomingOrderDraft.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `customer` | `String` | Trimmed candidate customer name. |
  | `emailSubject` | `String` | Trimmed inbound email subject line. |
  | `lineItems` | `[DraftLineItem]` | Embedded array of candidate lines (fields optional during review). |

---

### 3.4 Operations & Manufacturing
* **`Invoice`** (`server/src/models/Invoice.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `number` | `String` | Required, unique display ID (`INV-YYYY/MM/DD/AXXX`). |
  | `orderId` | `ObjectId` | Required foreign reference (`ref: "Order"`). |
  | `status` | `String` | Enum: `["Draft", "Sent", "Paid", "Overdue"]`, default: `"Draft"`. |
  | `issueDate` | `Date` | Optional invoice billing date. |
  | `dueDate` | `Date` | Optional invoice payment due date. |

* **`Shipment`** (`server/src/models/Shipment.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `number` | `String` | Required, unique display ID (`SHP-YYYY/MM/DD/AXXX`). |
  | `orderId` | `ObjectId` | Required foreign reference (`ref: "Order"`). |
  | `invoiceId` | `ObjectId` | Optional foreign reference (`ref: "Invoice"`, default: null). |
  | `status` | `String` | Enum: `["Draft", "Packed", "Dispatched", "Delivered"]`, default: `"Draft"`. |
  | `date` | `Date` | Optional dispatch/delivery date. |

* **`ProductionJob`** (`server/src/models/ProductionJob.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `number` | `String` | Required, unique display ID (`JOB-YYYY/MM/DD/AXXX`). |
  | `orderNumber` | `String` | Optional Make-to-Order link to `Order.number`. |
  | `customer` | `String` | Optional destination customer name. |
  | `product` | `String` | Required manufactured product name. |
  | `qty` | `Number` | Required, `min: 1` units to produce. |
  | `due` | `Date` | Required manufacturing due date. |
  | `status` | `String` | Enum: `["Planned", "In Progress", "Completed"]`, default: `"Planned"`. |
  | `progress` | `Number` | `min: 0`, `max: 100`, default: `0` (percentage complete). |

---

### 3.5 Atomic Numbering & Dashboard Analytics
* **`Counter`** (`server/src/models/Counter.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `key` | `String` | Required, unique partition key (e.g. `"order:2026"`, `"invoice:2026"`). |
  | `seq` | `Number` | Default: `0`; incremented atomically via `$inc` in `findOneAndUpdate`. |

* **`ActivityFeedEntry`** (`server/src/models/Dashboard.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `message` | `String` | Required audit message (e.g. `"ORD-1041 moved to Invoiced"`). |
  | `occurredAt` | `Date` | Default: `Date.now`. |

* **`RevenueSeriesPoint`** (`server/src/models/Dashboard.ts`):
  | Field | Type | Rules & Constraints |
  |---|---|---|
  | `week` | `String` | Required weekly bucket identifier (e.g. `"W1"` through `"W8"`). |
  | `revenue` | `Number` | Required gross revenue amount in USD. |
  | `orders` | `Number` | Required order count for that week. |
  | `sortOrder` | `Number` | Required integer (1–8) for chronological graph display. |

---

## 4. Indexing & Query Optimization Strategy

| Collection | Indexed Field(s) | Type | Rationale |
|---|---|---|---|
| `users` | `username: 1` | Unique | Enforces unique usernames and optimizes login authentication. |
| `products` | `sku: 1` | Unique | Enforces catalog item uniqueness across the platform. |
| `inventoryitems` | `sku: 1` | Unique | Fast warehouse lookups and 1:1 sync with `Product.sku`. |
| `orders` | `number: 1` | Unique | Fast lookup and duplicate prevention for business order IDs. |
| `invoices` | `number: 1` | Unique | Prevents duplicate invoice issuance numbers. |
| `invoices` | `orderId: 1` | Foreign Key | Accelerates `.populate("orderId")` relational lookups. |
| `shipments` | `number: 1` | Unique | Prevents duplicate freight manifest numbers. |
| `shipments` | `orderId: 1` | Foreign Key | Fast lookups for order delivery status. |
| `productionjobs`| `number: 1` | Unique | Guarantees unique job tracking IDs on the shop floor. |
| `counters` | `key: 1` | Unique | Required for atomic upsert increments in `findOneAndUpdate`. |
# Schema Diagram — Order, IncomingOrderDraft & Counter

> **Scope:** the three MongoDB/Mongoose schemas behind the Sales & Orders
> module: [`Order.ts`](../server/src/models/Order.ts),
> [`IncomingOrderDraft.ts`](../server/src/models/IncomingOrderDraft.ts), and
> [`Counter.ts`](../server/src/models/Counter.ts). See
> [`srcdesign.md`](./srcdesign.md) for the REST conventions these schemas'
> endpoints follow, and `CLAUDE.md` for how the rest of the backend fits
> together.

## 1. How the three schemas relate

```mermaid
erDiagram
    IncomingOrderDraft ||--o{ DraftLineItem : embeds
    Order ||--o{ OrderLineItem : embeds
    Counter ||..o{ Order : "hands out order.number"

    IncomingOrderDraft {
        ObjectId _id
        string customer
        string emailSubject
        DraftLineItem[] lineItems
        Date createdAt
        Date updatedAt
    }
    DraftLineItem {
        ObjectId _id
        string product
        number qty "optional, unlike Order's"
        number price "optional, unlike Order's"
    }
    Order {
        ObjectId _id
        string number "unique, e.g. ORD-2026/09/01/A016"
        string customer
        OrderLineItem[] lineItems
        string status "Draft|Confirmed|Invoiced|Shipped|Closed"
        Date date
        number amount "virtual, not stored"
        Date createdAt
        Date updatedAt
    }
    OrderLineItem {
        ObjectId _id
        string product
        number qty "required, >= 1"
        number price "required, >= 0"
    }
    Counter {
        ObjectId _id
        string key "unique, e.g. order:2026"
        number seq
    }
```

**The lifecycle these three schemas exist to support:**

1. An inbound customer email is parsed (or entered by hand) into an
   **`IncomingOrderDraft`** — a holding area for something that *isn't a
   real order yet*, so a staff member can review/correct it first.
2. When approved (`POST /api/order-drafts/:id/approve`), the draft's line
   items are copied 1:1 into a brand-new **`Order`** (status `"Confirmed"`,
   since a human just reviewed it), the draft is deleted, and the order
   gets a human-readable `number`.
3. That `number` comes from **`Counter`** — a single shared atomic counter
   collection every record-numbered entity in the app draws from (Orders,
   Invoices, Shipments, Production Jobs each get their own prefix/sequence;
   this doc covers Order's use of it). See §4.

## 2. `Order`

| Field | Type | Notes |
|---|---|---|
| `number` | `String` | Required, **unique**. Human-readable id, e.g. `ORD-2026/09/01/A016` — see §4. Assigned once at creation; `order.controller.ts`'s `updateOrder` strips it from `PUT` bodies even if a client sends one, so it can never be overwritten after the fact. |
| `customer` | `String` | Trimmed. |
| `lineItems` | `[OrderLineItem]` | **Embedded** sub-documents (see §2.1) — not a separate collection. Custom validator rejects an empty array: *"An order must have at least one line item."* |
| `status` | `String` | Enum: `Draft`, `Confirmed`, `Invoiced`, `Shipped`, `Closed`. Defaults to `Draft`. Changed only through `PATCH /api/orders/:id/status` (the Kanban drag endpoint) in normal use, though `PUT` can also carry a status change. |
| `date` | `Date` | Required. |
| `amount` | `Number` (virtual) | **Not stored** — computed on read as `Σ(qty × price)` across `lineItems` (`orderSchema.virtual("amount")`). Can never drift out of sync with a line item edit, because there's nothing to keep in sync: it's recalculated every time the document is serialized. Only appears in JSON output because the schema sets `toJSON: { virtuals: true }` / `toObject: { virtuals: true }` — without that option a virtual is silently dropped from `res.json()`. |
| `createdAt` / `updatedAt` | `Date` | From `{ timestamps: true }`. |

### 2.1 `OrderLineItem` (embedded sub-schema)

| Field | Type | Notes |
|---|---|---|
| `product` | `String` | Trimmed. |
| `qty` | `Number` | **Required**, `min: 1` — a line with zero or negative quantity is never valid. |
| `price` | `Number` | **Required**, `min: 0` — free (0) is allowed, negative is not. |

Embedded rather than referenced, because a line item has no independent
existence: it can't be fetched, updated, or deleted except through its
parent `Order`. Mongoose gives each sub-document its own `_id`
automatically, which is what lets the UI target one specific line item
inside `lineItems` if it ever needs to (e.g. removing a single row from an
order being edited).

## 3. `IncomingOrderDraft`

| Field | Type | Notes |
|---|---|---|
| `customer` | `String` | Trimmed. |
| `emailSubject` | `String` | Trimmed. The subject line of the inbound email this draft was parsed from. |
| `lineItems` | `[DraftLineItem]` | Embedded, same rationale as `Order.lineItems`. |
| `createdAt` / `updatedAt` | `Date` | From `{ timestamps: true }`. |

Notably, `IncomingOrderDraft` has **no `status` and no `number`** — it
isn't a business record yet, so neither applies. It also has no `date`;
`Order.date` is set fresh at approval time (`new Date()` in
`orderDraft.controller.ts`'s `approveDraft`), not carried over from the
draft.

### 3.1 `DraftLineItem` (embedded sub-schema)

| Field | Type | Notes |
|---|---|---|
| `product` | `String` | Trimmed. |
| `qty` | `Number` | `min: 1` — **not required**, unlike `OrderLineItem.qty`. A draft is allowed to have an incomplete/unparsed line while a human is still reviewing it; an `Order` is not. |
| `price` | `Number` | `min: 0` — **not required**, same reasoning. |

This is the one deliberate structural difference between the two line-item
sub-schemas: `Order`'s line items must always be complete and valid, since
an order is a committed business record, while a draft's may still be
mid-review.

## 4. `Counter` & human-readable record numbers

```mermaid
sequenceDiagram
    participant C as order.controller.ts
    participant R as recordNumber.ts
    participant Ctr as Counter (Mongo)

    C->>R: generateRecordNumber("order", new Date())
    R->>Ctr: findOneAndUpdate({ key: "order:2026" }, { $inc: { seq: 1 } }, { upsert: true, new: true })
    Note over Ctr: Atomic on the DB side — two concurrent<br/>requests can never read-then-write the same seq.
    Ctr-->>R: { seq: 17 }
    R-->>C: "ORD-2026/09/01/A017"
```

| Field | Type | Notes |
|---|---|---|
| `key` | `String` | Required, **unique**. One document per (record type, year) — e.g. `"order:2026"`, `"invoice:2026"`. |
| `seq` | `Number` | Defaults to `0`; incremented atomically per call. |

`nextSequence(type, year)` (in `Counter.ts`) is the only thing that ever
touches this collection, via a single
`findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true, new: true })`
— the standard Mongoose atomic-counter pattern. The increment happens
**in one operation on the database itself**, not as a
read-then-write-in-application-code sequence, which is what makes it safe
under concurrency: MongoDB serializes concurrent `findOneAndUpdate` calls
against the same document, so two Orders created in the same instant still
get two different, gapless sequence numbers. This was verified directly —
see the "Verify end-to-end database persistence" section of the Sales &
Order Pipeline Persistence work: 8 orders created concurrently all came
back with distinct, sequential numbers (`A017`–`A024`), no duplicates or
gaps.

`formatRecordNumber` (in [`recordNumber.ts`](../server/src/utils/recordNumber.ts))
turns a raw `seq` into the display string:

```
ORD-2026/09/01/A017
└┬┘ └──┬──┘ └┬┘
 │      │     └─ letter block (A001-A999, then B001, C001, ...) — see below
 │      └─────── the date the record was created (not the counter's reset date)
 └────────────── type prefix: ORD / INV / SHP / JOB
```

The letter block exists because the sequence resets **once a year**, not
once a day — `key` is `"order:2026"`, not `"order:2026-09-01"` — so a
plain 3-digit number would only allow 999 orders across an entire
calendar year. Spending one letter buys another 999 (`A001`–`A999`, then
`B001`–`B999`, …), which comfortably covers far more volume than a bare
number ever could, at the cost of one extra character.

The prefix exists so two otherwise-identical-looking numbers stay
distinguishable — an `Order` and an `Invoice` created on the same day both
start their own sequence at `A001`; without the prefix there would be no
way to tell `2026/09/01/A001` the order apart from `2026/09/01/A001` the
invoice just by looking at it.

## 5. Verified behaviour (not just the schema on paper)

The following was exercised directly against the real MongoDB Atlas
cluster while writing this doc, not just inferred from the code:

- Creating an `Order` without `lineItems` → `400`, with the exact
  validation message above.
- Creating a valid multi-line-item `Order` → `amount` virtual computed
  correctly (`Σ qty×price`), `number` assigned in the expected format.
- `PATCH /api/orders/:id/status` with an invalid status string → `400`,
  order unchanged.
- `PUT /api/orders/:id` with a client-supplied `number` in the body → the
  server-assigned `number` is kept; the client's value is silently
  ignored, never applied.
- 8 orders created concurrently (`Promise`-style parallel requests) → 8
  unique, sequential `number`s, confirming `Counter`'s atomicity under
  real concurrency rather than just reading the code and assuming it's
  race-free.
- Full draft lifecycle: create → edit (`PUT`, changing a line item's
  `qty`) → approve (`POST .../approve`) → the resulting `Order` reflects
  the *edited* quantity (proving `approveDraft` reads the draft fresh from
  the database rather than trusting a stale value), the draft is deleted
  (`GET` on it afterward → `404`), and the new `Order` starts life as
  `status: "Confirmed"`.

## 6. ProductionJob Schema & Order Linkage

**Files:**
[`server/src/models/ProductionJob.ts`](../server/src/models/ProductionJob.ts),
[`server/src/controllers/productionJob.controller.ts`](../server/src/controllers/productionJob.controller.ts),
[`server/src/routes/productionJob.routes.ts`](../server/src/routes/productionJob.routes.ts).

### 6.1 Mongoose Schema

```
Collection: productionjobs
```

| Field         | Type     | Required | Default     | Constraints / Notes                                                 |
|---------------|----------|----------|-------------|----------------------------------------------------------------------|
| `_id`         | ObjectId | auto     | —           | MongoDB primary key; used in API URLs (`/api/production-jobs/:id`). |
| `number`      | String   | ✅       | —           | Human-readable ID (e.g. `JOB-2026/09/05/A001`). Unique, immutable after creation. Generated by `generateRecordNumber("job", …)` — see §4 above for the Counter system. |
| `orderNumber` | String   | ❌       | —           | Soft reference to an `Order`'s `number` field. Links a Make-to-Order production run to the sales order that triggered it. Not a Mongo `ref` — it's a display-level join, matched by `number` not `_id`. |
| `customer`    | String   | ❌       | —           | Customer name associated with the linked order. Denormalized for display; the canonical customer lives on the `Order` document. |
| `product`     | String   | ✅       | —           | Name of the product being manufactured (matches a `Product.name`).  |
| `qty`         | Number   | ✅       | —           | Quantity to produce. `min: 1`.                                       |
| `due`         | Date     | ✅       | —           | Target completion date for the production run.                      |
| `status`      | String   | ❌       | `"Planned"` | Enum: `"Planned"`, `"In Progress"`, `"Completed"`. See §6.2.       |
| `progress`    | Number   | ❌       | `0`         | Completion percentage. `min: 0`, `max: 100`. Only meaningful while status is `"In Progress"`. |
| `createdAt`   | Date     | auto     | —           | Mongoose `timestamps: true`.                                         |
| `updatedAt`   | Date     | auto     | —           | Mongoose `timestamps: true`.                                         |

### 6.2 Status State Machine

```mermaid
stateDiagram-v2
    [*] --> Planned : Job created
    Planned --> InProgress : Work begins
    InProgress --> Completed : progress reaches 100% or manual move
    Planned --> Completed : Skip (direct completion)

    state Planned {
        [*] --> [*] : Editable (product, qty, due, orderNumber, customer)
    }

    state InProgress {
        [*] --> [*] : Only progress (0-100%) can be updated
    }

    state Completed {
        [*] --> [*] : Read-only
    }
```

**Transition rules enforced by the frontend domain model**
(`src/domain/ProductionJob.ts`):

- **Planned**: Full edit of scope fields (`product`, `qty`, `due`,
  `orderNumber`, `customer`) via `canEdit`.
- **In Progress**: Only `progress` (0–100%) is editable, via
  `canEditProgress`. Scope is frozen.
- **Completed**: Fully read-only; no fields are editable.

**Backend enforcement**: Status transitions are accepted via
`PATCH /api/production-jobs/:id/status` (body: `{ status, progress? }`).
The Mongoose enum validator rejects any string outside the three allowed
values, returning `400`.

### 6.3 Order Linkage (Make-to-Order)

A `ProductionJob` is optionally linked to an `Order` via the
`orderNumber` field. This is a *soft reference* — it stores the order's
human-readable `number` string (e.g. `ORD-2026/09/05/A001`), not its
`_id`. The linkage is established at job creation time when a production
run is triggered from a sales order.

```mermaid
erDiagram
    ORDER {
        ObjectId _id PK
        String number UK "e.g. ORD-2026/09/05/A001"
        String customer
        String status
    }

    PRODUCTION_JOB {
        ObjectId _id PK
        String number UK "e.g. JOB-2026/09/05/A001"
        String orderNumber FK "soft ref to Order.number"
        String customer "denormalized from Order"
        String product
        Number qty
        Date due
        String status "Planned | In Progress | Completed"
        Number progress "0-100"
    }

    ORDER ||--o{ PRODUCTION_JOB : "triggers (Make-to-Order)"
```

**Why a soft reference instead of `mongoose.Schema.Types.ObjectId ref`?**
The link uses the human-readable `number` rather than `_id` because the
production page's Kanban board displays the order number directly —
a `populate()` round-trip would add latency for a single string that's
already available at creation time. The trade-off is that deleting or
renaming an order doesn't cascade to production jobs, which is acceptable
since production jobs represent physical work that can't be "un-done" by
an order change.

### 6.4 API Endpoints

| Method | Path                                  | Description                                      |
|--------|---------------------------------------|--------------------------------------------------|
| GET    | `/api/production-jobs`                | List all production jobs.                        |
| GET    | `/api/production-jobs/:id`            | Get a single job by MongoDB `_id`.               |
| POST   | `/api/production-jobs`                | Create a new job. `number` is auto-assigned.     |
| PUT    | `/api/production-jobs/:id`            | Full update (product, qty, due, status, progress, orderNumber, customer). |
| PATCH  | `/api/production-jobs/:id/status`     | Partial update — status and/or progress only.    |

All routes are protected by `requireAuth` middleware (JWT session cookie).

### 6.5 Progress Tracking (0–100%)

The `progress` field represents WIP (Work In Progress) completion as an
integer percentage. Mongoose enforces `min: 0` and `max: 100` at the
schema level — any value outside this range triggers a validation error
(`400`). The field defaults to `0` at creation and is only semantically
meaningful while `status === "In Progress"`:

- **Planned** jobs: `progress` is `0` (default); the UI hides the
  progress bar.
- **In Progress** jobs: `progress` is actively updated by shop-floor
  operators as work advances.
- **Completed** jobs: `progress` is typically `100`; the UI shows it
  dimmed/read-only.
