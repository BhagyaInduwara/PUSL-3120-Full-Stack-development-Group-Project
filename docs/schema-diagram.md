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
