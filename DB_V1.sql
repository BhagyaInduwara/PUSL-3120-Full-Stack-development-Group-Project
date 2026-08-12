-- =============================================================================
-- FlowERP — DB_V1.sql
-- Table structure for the Supabase (Postgres) backend, V1.
--
-- Run this once against a fresh Supabase project (SQL Editor → New query →
-- paste this whole file → Run), then run DB_V1_Insert.sql to load master
-- data. Safe to re-run: every statement is idempotent (CREATE ... IF NOT
-- EXISTS / CREATE OR REPLACE).
--
-- Design notes (see CLAUDE.md "Database (Supabase, V1)" for the full story):
--   * Primary keys are TEXT, matching the human-readable ids the app already
--     uses everywhere (ORD-1036, INV-2039, ...) — no UUID/identity mapping
--     layer needed between the DB and the domain classes in src/domain/.
--   * `customer` on orders and `product` on orders/production_jobs stay as
--     plain TEXT columns rather than foreign keys into customers/products.
--     This mirrors the current domain model (Order.customer is a string,
--     not a Customer reference) — see src/domain/Order.ts. Tightening this
--     to a real FK is a deliberate future step, not an oversight.
--   * Every status column is CHECK-constrained to the same union type
--     TypeScript already enforces (OrderStatus, InvoiceStatus, ...), so an
--     invalid status can't enter the database even from outside the app.
--   * RLS is enabled on every table. The app has no auth/user system yet,
--     so V1 ships one permissive "allow everything" policy per table — see
--     the RLS section at the bottom. Replace those before any real user
--     data goes in.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Shared trigger: keep `updated_at` current on every UPDATE.
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Master data
-- -----------------------------------------------------------------------------

create table if not exists customers (
  id         text primary key,
  name       text not null,
  contact    text not null default '',
  email      text not null default '',
  city       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id         text primary key,
  name       text not null,
  category   text not null default '',
  contact    text not null default '',
  lead_time  text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  sku        text primary key,
  name       text not null,
  category   text not null default '',
  price      numeric(12, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_items (
  sku            text primary key references products (sku) on update cascade,
  name           text not null,
  category       text not null default '',
  qty            integer not null default 0 check (qty >= 0),
  reorder_point  integer not null default 0 check (reorder_point >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Sales: orders, incoming (email-parsed) drafts awaiting approval
-- -----------------------------------------------------------------------------

create table if not exists orders (
  id         text primary key,
  customer   text not null,
  product    text not null,
  qty        integer not null check (qty > 0),
  price      numeric(12, 2) not null check (price >= 0),
  status     text not null check (status in ('Draft', 'Confirmed', 'Invoiced', 'Shipped', 'Closed')),
  order_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_status on orders (status);

create table if not exists incoming_order_drafts (
  id            text primary key,
  customer      text not null,
  email_subject text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists incoming_order_draft_line_items (
  id         bigint generated always as identity primary key,
  draft_id   text not null references incoming_order_drafts (id) on delete cascade,
  position   integer not null default 0,
  product    text not null,
  qty        integer not null check (qty > 0),
  price      numeric(12, 2) not null check (price >= 0)
);

create index if not exists idx_draft_line_items_draft_id on incoming_order_draft_line_items (draft_id);

-- -----------------------------------------------------------------------------
-- Billing & fulfillment: invoices, shipments, production jobs
-- -----------------------------------------------------------------------------

create table if not exists invoices (
  id         text primary key,
  order_id   text not null references orders (id) on update cascade,
  status     text not null check (status in ('Draft', 'Sent', 'Paid', 'Overdue')),
  issue_date date,
  due_date   date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_order_id on invoices (order_id);
create index if not exists idx_invoices_status on invoices (status);

create table if not exists shipments (
  id         text primary key,
  order_id   text not null references orders (id) on update cascade,
  invoice_id text references invoices (id) on update cascade,
  status     text not null check (status in ('Draft', 'Packed', 'Dispatched', 'Delivered')),
  ship_date  date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipments_order_id on shipments (order_id);
create index if not exists idx_shipments_status on shipments (status);

create table if not exists production_jobs (
  id         text primary key,
  product    text not null,
  qty        integer not null check (qty > 0),
  due_date   date not null,
  status     text not null check (status in ('Planned', 'In Progress', 'Completed')),
  progress   smallint not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_production_jobs_status on production_jobs (status);

-- -----------------------------------------------------------------------------
-- Dashboard feeds
-- -----------------------------------------------------------------------------

create table if not exists activity_feed (
  id           bigint generated always as identity primary key,
  message      text not null,
  occurred_at  timestamptz not null default now()
);

create index if not exists idx_activity_feed_occurred_at on activity_feed (occurred_at desc);

create table if not exists revenue_series (
  id      bigint generated always as identity primary key,
  week    text not null,
  revenue numeric(12, 2) not null check (revenue >= 0),
  orders  integer not null check (orders >= 0),
  sort_order integer not null default 0
);

-- -----------------------------------------------------------------------------
-- `updated_at` triggers
-- -----------------------------------------------------------------------------

drop trigger if exists trg_customers_updated_at on customers;
create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();

drop trigger if exists trg_suppliers_updated_at on suppliers;
create trigger trg_suppliers_updated_at before update on suppliers
  for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_inventory_items_updated_at on inventory_items;
create trigger trg_inventory_items_updated_at before update on inventory_items
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

drop trigger if exists trg_incoming_order_drafts_updated_at on incoming_order_drafts;
create trigger trg_incoming_order_drafts_updated_at before update on incoming_order_drafts
  for each row execute function set_updated_at();

drop trigger if exists trg_invoices_updated_at on invoices;
create trigger trg_invoices_updated_at before update on invoices
  for each row execute function set_updated_at();

drop trigger if exists trg_shipments_updated_at on shipments;
create trigger trg_shipments_updated_at before update on shipments
  for each row execute function set_updated_at();

drop trigger if exists trg_production_jobs_updated_at on production_jobs;
create trigger trg_production_jobs_updated_at before update on production_jobs
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
--
-- Every table gets RLS turned on (Supabase best practice: the anon/public
-- key is exposed to the browser, so a table with RLS enabled and no policy
-- blocks all access by default — safer than forgetting to enable it later).
--
-- V1 has no auth/user system in the app yet, so each table gets one
-- permissive policy allowing full access to both the `anon` and
-- `authenticated` roles. TIGHTEN OR REMOVE THESE before real customer data
-- or multiple users are involved — e.g. scope writes to `authenticated`
-- only, or add per-row ownership checks once accounts exist.
-- -----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'customers', 'suppliers', 'products', 'inventory_items',
      'orders', 'incoming_order_drafts', 'incoming_order_draft_line_items',
      'invoices', 'shipments', 'production_jobs',
      'activity_feed', 'revenue_series'
    ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists allow_all_v1 on %I;', t);
    execute format(
      'create policy allow_all_v1 on %I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
