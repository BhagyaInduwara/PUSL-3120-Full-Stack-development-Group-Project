# FlowERP

FlowERP is a small-business ERP system with a Kanban-style Sales &
Orders board, plus invoicing, inventory, shipments, and production
tracking — built with Next.js, Express, and MongoDB.

## How to run

**Frontend:**

```bash
npm install
cp .env.example .env   # fill in AUTH_SECRET and BACKEND_URL — see comments in the file
npm run dev             # http://localhost:3000
```

**Backend:**

```bash
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET — see comments in the file
npm run seed             # creates the admin/admin@123 account
npm run dev               # http://localhost:4000
```

Run both at once from the root with `npm run dev:all`.
