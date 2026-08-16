# FlowERP — Team REST Resource Design & API Standards Guide

> **Audience:** All FlowERP team members  
> **Purpose:** A shared guide to ensure consistent RESTful endpoint styling, unified request/response contracts, and conflict-free collaboration across all ERP modules (Orders, Shipments, Products, Customers, Invoices, Suppliers, Inventory, and Auth).

---

## 1. Core 6 REST Design Principles

### 1. URLs Name Things, Not Actions (Nouns, Not Verbs)
* Endpoints must represent **resources (nouns)**, not actions (verbs).
* The **HTTP Method** defines what operation is being performed:
  - `GET`: Retrieve a resource or a list of resources.
  - `POST`: Create a new resource.
  - `PUT`: Replace an entire resource (or `PATCH` to partially update).
  - `DELETE`: Remove a resource.

| ❌ Avoid (RPC / Action-based) | ✅ Use (RESTful Resource) | Method |
| :--- | :--- | :--- |
| `/api/createOrder` | `/api/orders` | `POST` |
| `/api/getAllProducts` | `/api/products` | `GET` |
| `/api/updateShipmentStatus` | `/api/shipments/:id` | `PATCH` |
| `/api/deleteCustomer?id=5` | `/api/customers/:id` | `DELETE` |
| `/api/auth/login` | `/api/auth/login` *(or `/api/sessions`)* | `POST` |

---

### 2. Plural Nouns for Collections
* Always use plural nouns consistently for resource endpoints:
  - Entire Collection: `/api/orders`, `/api/products`, `/api/shipments`
  - Single Resource by ID: `/api/orders/:id`, `/api/products/:id`, `/api/shipments/:id`

---

### 3. Nest Only to Express Ownership (Max 2 Levels)
* Only nest endpoints when a child resource strictly belongs to a parent resource.
* **Keep nesting shallow (maximum 2 levels)** to prevent messy URLs:
  - ✅ `/api/orders/:orderId/items` (Items belonging to a specific order)
  - ✅ `/api/customers/:customerId/orders` (Orders placed by a specific customer)
  - ✅ `/api/users/:userId/sessions` (Active sessions for a user)
* ❌ *Avoid deep nesting:* `/api/companies/:cId/branches/:bId/warehouses/:wId/products/:pId`  
  *Instead, use a top-level route with query parameters:* `/api/products?warehouseId=:wId`

---

### 4. Filtering, Sorting, and Pagination Belong in the Query String
* Do NOT create separate endpoints for every filter or search criteria.
* Use **query parameters** (`?key=value`) for filtering, sorting, searching, and pagination:

```http
# Filtering by status and customer
GET /api/orders?status=pending&customerId=64f1a2...

# Searching by name/keyword
GET /api/products?search=rose&category=fresh-cut

# Sorting (prefix '-' for descending)
GET /api/shipments?sort=-estimatedDelivery

# Pagination (page & limit)
GET /api/orders?page=2&limit=20&sort=-createdAt
```

---

### 5. Version from the Start (`/api/v1/...`)
* Structure routes under a version prefix when agreed by the team:
  - `/api/v1/orders`
  - `/api/v1/products`
  - `/api/v1/shipments`
* Versioning prevents breaking frontend clients when data schemas evolve in future milestones.

---

### 6. Agree the Contract Before You Write Code
* Before writing backend logic or UI screens, agree on the **TypeScript DTO interfaces**, **request payload**, **response structure**, and **HTTP status codes**.
* Front-end and Back-end developers can then build and test independently using mock data or proxies.

---

## 2. ERP Module Endpoint Matrix

Use this table as the reference blueprint for each team member's module:

| Module | Resource URL | HTTP Method | Expected Status | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/login` | `POST` | `200 OK` | Authenticate user & set JWT cookie |
| | `/api/auth/register` | `POST` | `201 Created` | Self-service new user registration |
| | `/api/auth/logout` | `POST` / `DELETE` | `200 OK` | Destroy session & clear cookie |
| | `/api/auth/me` | `GET` | `200 OK` | Fetch currently logged-in user profile |
| **Users** | `/api/users` | `GET` | `200 OK` | List users (supports `?role=staff`) |
| | `/api/users` | `POST` | `201 Created` | Admin creates user account |
| **Customers** | `/api/customers` | `GET` | `200 OK` | List customers (supports `?search=...`) |
| | `/api/customers` | `POST` | `201 Created` | Create a new customer profile |
| | `/api/customers/:id` | `GET` | `200 OK` | Get single customer details |
| | `/api/customers/:id` | `PUT` / `PATCH` | `200 OK` | Update customer details |
| | `/api/customers/:id` | `DELETE` | `200 OK` / `204` | Remove customer record |
| **Suppliers** | `/api/suppliers` | `GET` | `200 OK` | List suppliers |
| | `/api/suppliers` | `POST` | `201 Created` | Add new supplier |
| | `/api/suppliers/:id` | `GET` / `PUT` / `DELETE` | Standard | Manage supplier by ID |
| **Products** | `/api/products` | `GET` | `200 OK` | List products (`?category=...&search=...`) |
| | `/api/products` | `POST` | `201 Created` | Create new product |
| | `/api/products/:id` | `GET` / `PUT` / `DELETE` | Standard | Manage product by ID |
| **Orders / Sales** | `/api/orders` | `GET` | `200 OK` | List orders (`?status=...&page=1`) |
| | `/api/orders` | `POST` | `201 Created` | Create a new sales order |
| | `/api/orders/:id` | `GET` | `200 OK` | Get full order details & item lines |
| | `/api/orders/:id/status` | `PATCH` | `200 OK` | Update order state (`confirmed`, `cancelled`) |
| **Shipments** | `/api/shipments` | `GET` | `200 OK` | List shipments (`?status=in-transit`) |
| | `/api/shipments` | `POST` | `201 Created` | Create new shipment dispatch |
| | `/api/shipments/:id` | `GET` | `200 OK` | Track specific shipment |
| | `/api/shipments/:id` | `PATCH` | `200 OK` | Update tracking status or carrier |
| **Invoices** | `/api/invoices` | `GET` | `200 OK` | List invoices (`?paid=false`) |
| | `/api/invoices` | `POST` | `201 Created` | Generate new invoice for an order |
| | `/api/invoices/:id` | `GET` | `200 OK` | Get invoice breakdown & payment status |

---

## 3. Standard HTTP Status Codes

Always use semantic HTTP status codes. Avoid returning `200 OK` for errors.

| Status Code | Name | When to Use in FlowERP |
| :--- | :--- | :--- |
| **`200 OK`** | Success | Standard response for successful `GET`, `PUT`, `PATCH`, or `DELETE`. |
| **`201 Created`** | Created | Returned after successful `POST` when a new record is saved to the database. |
| **`204 No Content`** | No Content | Optional for successful `DELETE` operations where no JSON body is returned. |
| **`400 Bad Request`** | Client Error | Input validation failure (missing required fields, malformed data). |
| **`401 Unauthorized`** | Unauthenticated | Missing, invalid, or expired session/JWT token. |
| **`403 Forbidden`** | Permission Denied | Authenticated user lacks permission (e.g. staff trying an admin-only action). |
| **`404 Not Found`** | Resource Missing | Requested ID does not exist in the database (e.g. order not found). |
| **`409 Conflict`** | Conflict | Duplicate unique field (e.g. existing email, duplicate SKU, or taken username). |
| **`422 Unprocessable`** | Business Logic Error | Valid syntax, but violates business rule (e.g. shipping an unpaid order). |
| **`500 Internal Error`** | Server Error | Uncaught server exception or unexpected failure. |
| **`503 Service Unavailable`** | Service Down | Database disconnected or downstream microservice unreachable. |

---

## 4. Standard Response & Error Payload Formats

### A. Single Resource Response
Wrap single resources in a clear key or return the entity:
```json
{
  "order": {
    "id": "66bc8d1...",
    "orderNumber": "ORD-1002",
    "customer": "Floral Boutique",
    "total": 1250.00,
    "status": "confirmed",
    "createdAt": "2026-08-16T12:00:00.000Z"
  }
}
```

### B. Collection List Response (with Pagination metadata)
```json
{
  "orders": [ ... ],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

### C. Standard Error Response
Every error response across all modules must follow this consistent schema:
```json
{
  "error": "Human-readable explanation of what went wrong."
}
```

---

## 5. Team Git Collaboration & Merge-Safe Guidelines

To prevent merge conflicts when working in parallel:

1. **Own Your Files:** Each team member should keep their changes isolated to their own feature folder:
   - **Controller:** `server/src/controllers/<feature>.controller.ts`
   - **Routes:** `server/src/routes/<feature>.routes.ts`
   - **Model:** `server/src/models/<Feature>.ts`
   - **Frontend UI / API:** `src/app/<feature>/` and `src/app/api/<feature>/`
2. **Shared Files (`app.ts`):** 
   - Mount your route with a single clean line in `server/src/app.ts`:
     ```typescript
     app.use("/api/orders", orderRouter);
     ```
   - Avoid reorganizing or refactoring other members' route registrations.
3. **Always Verify Before Pushing:**
   ```bash
   # In root directory:
   npm run build

   # In server/ directory:
   npm run build
   ```
   If both build with **0 errors**, your branch is safe to merge!
