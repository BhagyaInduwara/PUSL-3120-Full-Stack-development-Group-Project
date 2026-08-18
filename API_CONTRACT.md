# FlowERP — API Specification & Contract

This document serves as the formal API contract for the **FlowERP** backend services. It outlines the base configuration, authentication mechanisms, status codes, data models, and detailed endpoint request/response specifications for both the Express + Mongoose backend (`/server`) and Next.js Route Handlers.

---

## 1. System Overview & Architecture

### Base URLs
- **Express Backend (Primary API)**: `http://localhost:4000/api`
- **Next.js Frontend / Prototype API**: `http://localhost:3000/api`

### Content Type & Encoding
- All request payloads must be JSON-formatted (`Content-Type: application/json`).
- All response payloads are returned as JSON (`Content-Type: application/json; charset=utf-8`).

### Authentication & Session Model
Authentication is cookie-based via signed tokens stored in `httpOnly` HTTP cookies:
- **Cookie Name**: `flow_session`
- **Security Attributes**:
  - `httpOnly: true` (Inaccessible to client-side JavaScript, mitigating XSS risks)
  - `sameSite: "lax"` (Development) / `"none"` (Cross-domain HTTPS production)
  - `secure: true` (Enforced in production HTTPS environments)
  - `maxAge`: 604,800,000 ms (7 days)
- **CORS Requirements**: Client `fetch()` requests must include `credentials: "include"`, and the backend configures `CORS` with `credentials: true` for `CLIENT_ORIGIN` (`http://localhost:3000`).

---

## 2. Standard HTTP Status Codes & Error Format

### HTTP Status Codes

| Code | Status | Description |
|---|---|---|
| `200` | OK | Request succeeded; response contains requested data. |
| `201` | Created | Resource successfully created. |
| `204` | No Content | Resource successfully deleted; no response body returned. |
| `400` | Bad Request | Validation error or missing required fields. |
| `401` | Unauthorized | Unauthenticated caller or invalid session cookie / credentials. |
| `403` | Forbidden | Insufficient permissions (e.g., non-admin requesting admin route). |
| `404` | Not Found | Resource or endpoint does not exist. |
| `409` | Conflict | Duplicate entity field (e.g., username or product SKU already taken). |
| `500` | Internal Server Error | Unhandled server exception. |

### Standard Error Response Shape

All error responses strictly follow a uniform error payload structure:

```json
{
  "error": "Human-readable description of the error"
}
```

---

## 3. Data Models & Schemas

### User Entity (`User`)
Represents an administrative or staff user account.
```typescript
interface PublicUser {
  id: string;          // MongoDB ObjectId string
  username: string;    // Case-insensitive, unique, min 3 chars
  role: "admin" | "staff";
  createdAt: string;   // ISO 8601 Timestamp
}
```
*Note: Password hashes (`passwordHash`) are excluded from queries by default and never exposed to the client.*

### Customer Entity (`Customer`)
```typescript
interface Customer {
  id: string;          // MongoDB ObjectId string
  name: string;        // Required, non-empty
  contact?: string;    // Optional contact person / title
  email?: string;      // Optional email address
  city?: string;       // Optional city location
  createdAt: string;   // ISO 8601 Timestamp
  updatedAt: string;   // ISO 8601 Timestamp
}
```

### Product Entity (`Product`)
```typescript
interface Product {
  id: string;          // MongoDB ObjectId string
  sku: string;         // Required, unique, uppercase (e.g. "PROD-001")
  name: string;        // Required, non-empty
  category?: string;   // Optional category classification
  price: number;       // Required numeric value >= 0
  createdAt: string;   // ISO 8601 Timestamp
  updatedAt: string;   // ISO 8601 Timestamp
}
```

### Supplier Entity (`Supplier`)
```typescript
interface Supplier {
  id: string;          // MongoDB ObjectId string
  name: string;        // Required, non-empty
  category?: string;   // Optional supplier domain/category
  contact?: string;    // Optional contact details / email
  leadTime?: string;   // Optional lead time string (e.g., "5 days")
  createdAt: string;   // ISO 8601 Timestamp
  updatedAt: string;   // ISO 8601 Timestamp
}
```

---

## 4. Endpoints Specification

---

### 4.1 Authentication Service (`/api/auth`)

#### `POST /api/auth/register`
Self-service user registration. Automatically assigns the `"staff"` role.

- **Access Level**: Public
- **Request Body**:
  ```json
  {
    "username": "string (required, min 3 chars)",
    "password": "string (required, min 6 chars)"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "user": {
      "id": "66c1f2e8a101b203c304d501",
      "username": "johndoe",
      "role": "staff",
      "createdAt": "2026-08-17T15:30:00.000Z"
    }
  }
  ```
  *(Sets `flow_session` HTTP cookie)*
- **Response `400 Bad Request`**: Username < 3 chars or Password < 6 chars.
- **Response `409 Conflict`**: Username already taken.

---

#### `POST /api/auth/login`
Authenticates user credentials and establishes a session. Constant-time password verification is used to protect against username enumeration attacks.

- **Access Level**: Public
- **Request Body**:
  ```json
  {
    "username": "string (required)",
    "password": "string (required)"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "66c1f2e8a101b203c304d501",
      "username": "admin",
      "role": "admin",
      "createdAt": "2026-08-17T15:30:00.000Z"
    }
  }
  ```
  *(Sets `flow_session` HTTP cookie)*
- **Response `400 Bad Request`**: Missing username or password.
- **Response `401 Unauthorized`**: Invalid username or password.

---

#### `POST /api/auth/logout`
Terminates the active user session.

- **Access Level**: Public / Authenticated
- **Request Body**: None
- **Response `200 OK`**:
  ```json
  {
    "ok": true
  }
  ```
  *(Clears `flow_session` HTTP cookie)*

---

#### `GET /api/auth/me`
Fetches current authenticated user context from session cookie.

- **Access Level**: Authenticated (`requireAuth`)
- **Request Headers / Cookies**: Cookie `flow_session`
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "66c1f2e8a101b203c304d501",
      "username": "admin",
      "role": "admin",
      "createdAt": "2026-08-17T15:30:00.000Z"
    }
  }
  ```
- **Response `401 Unauthorized`**: Session token missing, expired, or user deleted.

---

### 4.2 User Management Service (`/api/users`)

#### `GET /api/users`
Retrieves a list of all accounts sorted by creation date ascending.

- **Access Level**: Authenticated (`requireAuth`)
- **Response `200 OK`**:
  ```json
  {
    "users": [
      {
        "id": "66c1f2e8a101b203c304d501",
        "username": "admin",
        "role": "admin",
        "createdAt": "2026-08-17T15:30:00.000Z"
      },
      {
        "id": "66c1f2e8a101b203c304d502",
        "username": "staff1",
        "role": "staff",
        "createdAt": "2026-08-17T16:00:00.000Z"
      }
    ]
  }
  ```
- **Response `401 Unauthorized`**: Missing authentication.

---

#### `POST /api/users`
Direct provisioning of user accounts by an administrator.

- **Access Level**: Admin Only (`requireAuth` + `requireAdmin`)
- **Request Body**:
  ```json
  {
    "username": "string (required, min 3 chars)",
    "password": "string (required, min 6 chars)",
    "role": "admin | staff (optional, default: 'staff')"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "user": {
      "id": "66c1f2e8a101b203c304d503",
      "username": "manager",
      "role": "admin",
      "createdAt": "2026-08-17T16:15:00.000Z"
    }
  }
  ```
- **Response `400 Bad Request`**: Validation error (short username/password).
- **Response `401 Unauthorized`**: Missing authentication token.
- **Response `403 Forbidden`**: Authenticated user is not an administrator.
- **Response `409 Conflict`**: Username already exists.

---

### 4.3 Customer Management Service (`/api/customers`)

#### `GET /api/customers`
Retrieves all customer records sorted by creation date.

- **Access Level**: Authenticated
- **Response `200 OK`**:
  ```json
  {
    "customers": [
      {
        "id": "66c1f2e8c101b203c304d601",
        "name": "BluePeak Logistics",
        "contact": "Sarah Jenkins",
        "email": "sarah@bluepeak.com",
        "city": "Chicago",
        "createdAt": "2026-08-17T15:30:00.000Z",
        "updatedAt": "2026-08-17T15:30:00.000Z"
      }
    ]
  }
  ```

---

#### `GET /api/customers/:id`
Retrieves a specific customer by ID.

- **Access Level**: Authenticated
- **Path Parameters**: `id` (string - MongoDB ObjectId)
- **Response `200 OK`**:
  ```json
  {
    "customer": {
      "id": "66c1f2e8c101b203c304d601",
      "name": "BluePeak Logistics",
      "contact": "Sarah Jenkins",
      "email": "sarah@bluepeak.com",
      "city": "Chicago",
      "createdAt": "2026-08-17T15:30:00.000Z",
      "updatedAt": "2026-08-17T15:30:00.000Z"
    }
  }
  ```
- **Response `404 Not Found`**: Customer record does not exist.

---

#### `POST /api/customers`
Creates a new customer record.

- **Access Level**: Authenticated
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "contact": "string (optional)",
    "email": "string (optional)",
    "city": "string (optional)"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "customer": {
      "id": "66c1f2e8c101b203c304d602",
      "name": "Apex Innovations",
      "contact": "Mark Sloan",
      "email": "mark@apex.io",
      "city": "Seattle",
      "createdAt": "2026-08-17T16:30:00.000Z",
      "updatedAt": "2026-08-17T16:30:00.000Z"
    }
  }
  ```
- **Response `400 Bad Request`**: Missing `name` parameter.

---

#### `PUT /api/customers/:id`
Partially updates an existing customer record.

- **Access Level**: Authenticated
- **Path Parameters**: `id` (string - MongoDB ObjectId)
- **Request Body**:
  ```json
  {
    "name": "string (optional)",
    "contact": "string (optional)",
    "email": "string (optional)",
    "city": "string (optional)"
  }
  ```
- **Response `200 OK`**: Updated customer object.
- **Response `400 Bad Request`**: Provided `name` is empty.
- **Response `404 Not Found`**: Customer ID not found.

---

#### `DELETE /api/customers/:id`
Deletes a customer record.

- **Access Level**: Authenticated
- **Path Parameters**: `id` (string - MongoDB ObjectId)
- **Response `204 No Content`**: Successfully deleted.
- **Response `404 Not Found`**: Customer ID not found.

---

### 4.4 Product Management Service (`/api/products`)

#### `GET /api/products`
Retrieves all product records sorted by creation date.

- **Access Level**: Authenticated
- **Response `200 OK`**:
  ```json
  {
    "products": [
      {
        "id": "66c1f2e8d101b203c304d701",
        "sku": "PROD-001",
        "name": "Precision Hydraulic Pump",
        "category": "Machinery Parts",
        "price": 1450.00,
        "createdAt": "2026-08-17T15:30:00.000Z",
        "updatedAt": "2026-08-17T15:30:00.000Z"
      }
    ]
  }
  ```

---

#### `GET /api/products/:id`
Retrieves a single product by ID.

- **Access Level**: Authenticated
- **Path Parameters**: `id` (string - MongoDB ObjectId)
- **Response `200 OK`**:
  ```json
  {
    "product": {
      "id": "66c1f2e8d101b203c304d701",
      "sku": "PROD-001",
      "name": "Precision Hydraulic Pump",
      "category": "Machinery Parts",
      "price": 1450.00,
      "createdAt": "2026-08-17T15:30:00.000Z",
      "updatedAt": "2026-08-17T15:30:00.000Z"
    }
  }
  ```
- **Response `404 Not Found`**: Product ID not found.

---

#### `POST /api/products`
Creates a new catalog product.

- **Access Level**: Authenticated
- **Request Body**:
  ```json
  {
    "sku": "string (required, unique, e.g. 'PROD-002')",
    "name": "string (required)",
    "category": "string (optional)",
    "price": "number >= 0 (required)"
  }
  ```
- **Response `201 Created`**: Returns created `product` object.
- **Response `400 Bad Request`**: Missing `sku`, missing `name`, or invalid `price` (< 0 or non-numeric).
- **Response `409 Conflict`**: SKU already in use (case-insensitive check).

---

#### `PUT /api/products/:id`
Updates product fields.

- **Access Level**: Authenticated
- **Path Parameters**: `id` (string - MongoDB ObjectId)
- **Request Body**:
  ```json
  {
    "sku": "string (optional)",
    "name": "string (optional)",
    "category": "string (optional)",
    "price": "number >= 0 (optional)"
  }
  ```
- **Response `200 OK`**: Returns updated `product` object.
- **Response `400 Bad Request`**: Empty `sku`/`name` or invalid `price`.
- **Response `409 Conflict`**: New SKU is already taken by another product.
- **Response `404 Not Found`**: Product ID not found.

---

#### `DELETE /api/products/:id`
Deletes a product from catalog.

- **Access Level**: Authenticated
- **Path Parameters**: `id` (string - MongoDB ObjectId)
- **Response `204 No Content`**: Successfully deleted.
- **Response `404 Not Found`**: Product ID not found.

---

### 4.5 Supplier Management Service (`/api/suppliers`)

#### `GET /api/suppliers`
Lists all suppliers.

- **Access Level**: Authenticated
- **Response `200 OK`**:
  ```json
  {
    "suppliers": [
      {
        "id": "66c1f2e8e101b203c304d801",
        "name": "Vortex Steels Ltd",
        "category": "Raw Metals",
        "contact": "orders@vortexsteels.com",
        "leadTime": "7 days",
        "createdAt": "2026-08-17T15:30:00.000Z",
        "updatedAt": "2026-08-17T15:30:00.000Z"
      }
    ]
  }
  ```

---

#### `GET /api/suppliers/:id`
Retrieves a supplier by ID.

- **Access Level**: Authenticated
- **Path Parameters**: `id` (string - MongoDB ObjectId)
- **Response `200 OK`**: Supplier object.
- **Response `404 Not Found`**: Supplier ID not found.

---

#### `POST /api/suppliers`
Creates a new supplier record.

- **Access Level**: Authenticated
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "category": "string (optional)",
    "contact": "string (optional)",
    "leadTime": "string (optional)"
  }
  ```
- **Response `201 Created`**: Returns created `supplier` object.
- **Response `400 Bad Request`**: Missing `name`.

---

#### `PUT /api/suppliers/:id`
Partially updates a supplier record.

- **Access Level**: Authenticated
- **Path Parameters**: `id` (string - MongoDB ObjectId)
- **Request Body**: Partial update object (`name`, `category`, `contact`, `leadTime`).
- **Response `200 OK`**: Returns updated `supplier` object.
- **Response `400 Bad Request`**: Empty `name`.
- **Response `404 Not Found`**: Supplier ID not found.

---

#### `DELETE /api/suppliers/:id`
Deletes a supplier record.

- **Access Level**: Authenticated
- **Path Parameters**: `id` (string - MongoDB ObjectId)
- **Response `204 No Content`**: Successfully deleted.
- **Response `404 Not Found`**: Supplier ID not found.
