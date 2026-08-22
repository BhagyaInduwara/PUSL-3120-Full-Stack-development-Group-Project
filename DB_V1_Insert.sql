-- =============================================================================
-- FlowERP — DB_V1_Insert.sql
-- Master/demo data for the Supabase (Postgres) backend, V1.
--
-- Run DB_V1.sql first (creates the tables), then this file. Ported 1:1 from
-- src/repositories/seed-data.ts, which is itself ported 1:1 from the sample
-- `state = {...}` block in the original FlowERP Dashboard.dc.html — same
-- ids, names, quantities and prices, so data looks identical whether the
-- app is reading the in-memory repositories or this database.
--
-- Note on dates: the original mockup only ever stored display strings like
-- "Aug 6" (no year — see date/due/issueDate fields in seed-data.ts). This
-- file anchors them all to 2025 so they become real DATE values; the exact
-- year is arbitrary/illustrative, not meaningful data.
--
-- Safe to re-run: text-keyed tables use ON CONFLICT ... DO NOTHING (so
-- reseeding never overwrites edits made through the app), and the two
-- pure-demo, serial-keyed tables (activity_feed, revenue_series) are
-- truncated and reloaded each time.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Authentication: the one built-in admin account.
--
-- Password hash generated with pgcrypto's crypt()/gen_salt('bf') rather
-- than hardcoded, so the SQL is self-contained — no separate script needed
-- to produce the hash. This is the same account src/repositories/user-seed-data.ts
-- seeds into the in-memory UserRepository the app runs on today: username
-- "admin", password "admin@123". Change this password after your first
-- login against a real SqlUserRepository.
-- -----------------------------------------------------------------------------

insert into users (id, username, password_hash, role) values
  ('user-admin', 'admin', crypt('admin@123', gen_salt('bf')), 'admin')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Master data: customers, suppliers, products, inventory
-- -----------------------------------------------------------------------------

insert into customers (id, name, contact, email, city) values
  ('cust-bluepeak',    'Bluepeak Coworking',       'Sam Ortiz',      'sam@bluepeakcoworking.com',   'Denver, CO'),
  ('cust-crestwood',   'Crestwood Architects',     'Nadia Fell',     'nadia@crestwoodarch.com',     'Portland, OR'),
  ('cust-harborline',  'Harborline Logistics',     'Ravi Chandran',  'ravi@harborline.co',          'Newark, NJ'),
  ('cust-unionsquare', 'Union Square Café Co.',    'Ella Munro',     'ella@unionsquarecafe.com',    'Austin, TX'),
  ('cust-meridian',    'Meridian Dental Group',    'Dr. Alan Kwan',  'alan@meridiandental.com',     'Sacramento, CA'),
  ('cust-foothill',    'Foothill Realty Partners', 'Grace Lin',      'grace@foothillrealty.com',    'Boise, ID')
on conflict (id) do nothing;

insert into suppliers (id, name, category, contact, lead_time) values
  ('sup-cascade',   'Cascade Hardwoods Ltd',     'Lumber',             'Marcus Voss', '3 weeks'),
  ('sup-steelcore', 'Steelcore Fabrication',     'Metal frames',       'Lena Ruiz',   '2 weeks'),
  ('sup-pacific',   'Pacific Foam & Upholstery', 'Seating materials',  'Owen Patel',  '10 days'),
  ('sup-northgate', 'Northgate Casters Inc',     'Hardware',           'Faye Dumont', '1 week')
on conflict (id) do nothing;

insert into products (sku, name, category, price) values
  ('DSK-EXW', 'Executive Desk – Walnut',    'Desks',   890),
  ('CHR-MSH', 'Task Chair – Mesh Back',     'Seating', 145),
  ('BKC-OAK', '3-Shelf Bookcase – Oak',     'Storage', 175),
  ('FIL-2DR', 'Filing Cabinet – 2 Drawer',  'Storage', 210),
  ('RCP-LSH', 'Reception Desk – L-Shape',   'Desks',   980),
  ('CHR-ERG', 'Ergonomic Chair – Black',    'Seating', 210),
  ('TBL-CNF', 'Conference Table – 8ft',     'Tables',  1240),
  ('LCK-STL', 'Storage Locker – Steel',     'Storage', 130)
on conflict (sku) do nothing;

insert into inventory_items (sku, name, category, qty, reorder_point) values
  ('DSK-EXW', 'Executive Desk – Walnut',    'Desks',   14, 10),
  ('CHR-MSH', 'Task Chair – Mesh Back',     'Seating',  6, 20),
  ('BKC-OAK', '3-Shelf Bookcase – Oak',     'Storage', 22,  8),
  ('FIL-2DR', 'Filing Cabinet – 2 Drawer',  'Storage',  3, 12),
  ('RCP-LSH', 'Reception Desk – L-Shape',   'Desks',    9,  5),
  ('CHR-ERG', 'Ergonomic Chair – Black',    'Seating', 41, 15),
  ('TBL-CNF', 'Conference Table – 8ft',     'Tables',   2,  4),
  ('LCK-STL', 'Storage Locker – Steel',     'Storage', 55, 20)
on conflict (sku) do nothing;

-- -----------------------------------------------------------------------------
-- Sales: orders + the one incoming (email-parsed) draft awaiting review
-- -----------------------------------------------------------------------------

insert into orders (id, customer, product, qty, price, status, order_date) values
  ('ORD-1036', 'Bluepeak Coworking',       'Task Chair – Mesh Back',    24, 145,  'Closed',    date '2025-07-18'),
  ('ORD-1038', 'Crestwood Architects',     'Conference Table – 8ft',     2, 1240, 'Shipped',   date '2025-07-25'),
  ('ORD-1039', 'Harborline Logistics',     'Filing Cabinet – 2 Drawer', 15, 210,  'Shipped',   date '2025-07-28'),
  ('ORD-1040', 'Union Square Café Co.',    'Reception Desk – L-Shape',   1, 980,  'Invoiced',  date '2025-07-30'),
  ('ORD-1041', 'Meridian Dental Group',    'Ergonomic Chair – Black',    8, 210,  'Invoiced',  date '2025-08-01'),
  ('ORD-1042', 'Foothill Realty Partners', 'Executive Desk – Walnut',    5, 890,  'Confirmed', date '2025-08-03'),
  ('ORD-1043', 'Bluepeak Coworking',       '3-Shelf Bookcase – Oak',    10, 175,  'Confirmed', date '2025-08-04'),
  ('ORD-1044', 'Crestwood Architects',     'Storage Locker – Steel',    20, 130,  'Confirmed', date '2025-08-05'),
  ('ORD-1045', 'Harborline Logistics',     'Task Chair – Mesh Back',    30, 145,  'Draft',     date '2025-08-06'),
  ('ORD-1046', 'Meridian Dental Group',    'Reception Desk – L-Shape',   2, 980,  'Draft',     date '2025-08-06')
on conflict (id) do nothing;

insert into incoming_order_drafts (id, customer, email_subject) values
  ('ORD-1047', 'Foothill Realty Partners', 'Re: Office refresh — need quote for 12 desks')
on conflict (id) do nothing;

delete from incoming_order_draft_line_items where draft_id = 'ORD-1047';
insert into incoming_order_draft_line_items (draft_id, position, product, qty, price) values
  ('ORD-1047', 0, 'Executive Desk – Walnut', 12, 890),
  ('ORD-1047', 1, 'Ergonomic Chair – Black', 12, 210);

-- -----------------------------------------------------------------------------
-- Billing & fulfillment: invoices, shipments, production jobs
-- -----------------------------------------------------------------------------

insert into invoices (id, order_id, status, issue_date, due_date) values
  ('INV-2039', 'ORD-1036', 'Paid',    date '2025-07-19', date '2025-08-02'),
  ('INV-2041', 'ORD-1038', 'Paid',    date '2025-07-26', date '2025-08-09'),
  ('INV-2042', 'ORD-1039', 'Sent',    date '2025-07-29', date '2025-08-12'),
  ('INV-2043', 'ORD-1040', 'Sent',    date '2025-07-31', date '2025-08-14'),
  ('INV-2044', 'ORD-1041', 'Overdue', date '2025-07-20', date '2025-08-03'),
  ('INV-2045', 'ORD-1042', 'Draft',   null,               null)
on conflict (id) do nothing;

insert into shipments (id, order_id, invoice_id, status, ship_date) values
  ('SHP-501', 'ORD-1036', 'INV-2039', 'Delivered',  date '2025-07-22'),
  ('SHP-502', 'ORD-1038', 'INV-2041', 'Delivered',  date '2025-07-29'),
  ('SHP-503', 'ORD-1039', 'INV-2042', 'Dispatched', date '2025-08-05'),
  ('SHP-504', 'ORD-1040', 'INV-2043', 'Packed',     date '2025-08-06'),
  ('SHP-505', 'ORD-1041', 'INV-2044', 'Draft',      null),
  ('SHP-506', 'ORD-1042', null,       'Draft',      null)
on conflict (id) do nothing;

insert into production_jobs (id, product, qty, due_date, status, progress) values
  ('JOB-301', 'Executive Desk – Walnut',   17, date '2025-08-08', 'In Progress', 65),
  ('JOB-302', 'Task Chair – Mesh Back',    30, date '2025-08-07', 'In Progress', 40),
  ('JOB-303', 'Conference Table – 8ft',     2, date '2025-08-12', 'Planned',      0),
  ('JOB-304', 'Storage Locker – Steel',    20, date '2025-08-09', 'Planned',      0),
  ('JOB-305', 'Ergonomic Chair – Black',   12, date '2025-08-06', 'Completed',    0),
  ('JOB-306', 'Reception Desk – L-Shape',   3, date '2025-08-14', 'Planned',      0),
  ('JOB-307', '3-Shelf Bookcase – Oak',    10, date '2025-08-05', 'Completed',    0)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Dashboard feeds
--
-- The original design only ever stored relative display text ("Today, 2h
-- ago", "Yesterday"), not real timestamps, so `occurred_at` below is backed
-- into now() minus an approximate offset — close enough to reproduce the
-- same newest-first ordering the dashboard shows.
-- -----------------------------------------------------------------------------

truncate table activity_feed restart identity;
insert into activity_feed (message, occurred_at) values
  ('ORD-1041 moved to Invoiced',                              now() - interval '2 hours'),
  ('INV-2043 sent to Union Square Café Co.',                  now() - interval '4 hours'),
  ('SHP-503 dispatched to Harborline Logistics',              now() - interval '5 hours'),
  ('New draft order ORD-1047 parsed from email',              now() - interval '10 hours'),
  ('JOB-305 marked Completed',                                now() - interval '1 day 3 hours'),
  ('ORD-1044 confirmed by Crestwood Architects',              now() - interval '1 day 5 hours');

truncate table revenue_series restart identity;
insert into revenue_series (week, revenue, orders, sort_order) values
  ('W1', 8300,  14, 1),
  ('W2', 10600, 17, 2),
  ('W3', 9200,  15, 3),
  ('W4', 12600, 21, 4),
  ('W5', 11600, 19, 5),
  ('W6', 14000, 23, 6),
  ('W7', 15000, 25, 7),
  ('W8', 13100, 20, 8);
