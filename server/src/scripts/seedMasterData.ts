/**
 * Seeds demo master/transactional data into MongoDB — the same dataset
 * DB_V1_Insert.sql seeds into Supabase and src/repositories/seed-data.ts
 * seeds into the Next.js in-memory store, ported here so the app has
 * something to show when it's actually reading from this Mongo database
 * (which is what every page now does — see CLAUDE.md's "Authentication &
 * Users" status note on the frontend/backend cutover).
 *
 * Safe to re-run: skips entirely if Customers already exist, since
 * Orders/Invoices/Shipments are interlinked and a partial re-run would
 * create duplicates or dangling references.
 *
 * Run with: npm run seed:data
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Customer } from "../models/Customer.js";
import { Supplier } from "../models/Supplier.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Invoice } from "../models/Invoice.js";
import { Shipment } from "../models/Shipment.js";
import { IncomingOrderDraft } from "../models/IncomingOrderDraft.js";
import { generateRecordNumber } from "../utils/recordNumber.js";
import InventoryItem from "../models/InventoryItem.js";
import ProductionJob from "../models/ProductionJob.js";
import { ActivityFeedEntry, RevenueSeriesPoint } from "../models/Dashboard.js";

/** Seed dates are "Jul 18"-style strings with no year — anchor them all to the same demo year. */
const SEED_YEAR = 2026;

function parseDate(label: string): Date | undefined {
  if (!label || label === "—") return undefined;
  const parsed = new Date(`${label}, ${SEED_YEAR}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

const CUSTOMER_SEED = [
  { seedId: "cust-bluepeak", name: "Bluepeak Coworking", contact: "Sam Ortiz", email: "sam@bluepeakcoworking.com", city: "Denver, CO" },
  { seedId: "cust-crestwood", name: "Crestwood Architects", contact: "Nadia Fell", email: "nadia@crestwoodarch.com", city: "Portland, OR" },
  { seedId: "cust-harborline", name: "Harborline Logistics", contact: "Ravi Chandran", email: "ravi@harborline.co", city: "Newark, NJ" },
  { seedId: "cust-unionsquare", name: "Union Square Café Co.", contact: "Ella Munro", email: "ella@unionsquarecafe.com", city: "Austin, TX" },
  { seedId: "cust-meridian", name: "Meridian Dental Group", contact: "Dr. Alan Kwan", email: "alan@meridiandental.com", city: "Sacramento, CA" },
  { seedId: "cust-foothill", name: "Foothill Realty Partners", contact: "Grace Lin", email: "grace@foothillrealty.com", city: "Boise, ID" },
];

const SUPPLIER_SEED = [
  { name: "Cascade Hardwoods Ltd", category: "Lumber", contact: "Marcus Voss", leadTime: "3 weeks" },
  { name: "Steelcore Fabrication", category: "Metal frames", contact: "Lena Ruiz", leadTime: "2 weeks" },
  { name: "Pacific Foam & Upholstery", category: "Seating materials", contact: "Owen Patel", leadTime: "10 days" },
  { name: "Northgate Casters Inc", category: "Hardware", contact: "Faye Dumont", leadTime: "1 week" },
];

const PRODUCT_SEED = [
  { sku: "DSK-EXW", name: "Executive Desk – Walnut", category: "Desks", price: 890 },
  { sku: "CHR-MSH", name: "Task Chair – Mesh Back", category: "Seating", price: 145 },
  { sku: "BKC-OAK", name: "3-Shelf Bookcase – Oak", category: "Storage", price: 175 },
  { sku: "FIL-2DR", name: "Filing Cabinet – 2 Drawer", category: "Storage", price: 210 },
  { sku: "RCP-LSH", name: "Reception Desk – L-Shape", category: "Desks", price: 980 },
  { sku: "CHR-ERG", name: "Ergonomic Chair – Black", category: "Seating", price: 210 },
  { sku: "TBL-CNF", name: "Conference Table – 8ft", category: "Tables", price: 1240 },
  { sku: "LCK-STL", name: "Storage Locker – Steel", category: "Storage", price: 130 },
];

const INVENTORY_SEED = [
  { sku: "DSK-EXW", name: "Executive Desk – Walnut", category: "Desks", qty: 14, reorderPoint: 10 },
  { sku: "CHR-MSH", name: "Task Chair – Mesh Back", category: "Seating", qty: 6, reorderPoint: 20 },
  { sku: "BKC-OAK", name: "3-Shelf Bookcase – Oak", category: "Storage", qty: 22, reorderPoint: 8 },
  { sku: "FIL-2DR", name: "Filing Cabinet – 2 Drawer", category: "Storage", qty: 3, reorderPoint: 12 },
  { sku: "RCP-LSH", name: "Reception Desk – L-Shape", category: "Desks", qty: 9, reorderPoint: 5 },
  { sku: "CHR-ERG", name: "Ergonomic Chair – Black", category: "Seating", qty: 41, reorderPoint: 15 },
  { sku: "TBL-CNF", name: "Conference Table – 8ft", category: "Tables", qty: 2, reorderPoint: 4 },
  { sku: "LCK-STL", name: "Storage Locker – Steel", category: "Storage", qty: 55, reorderPoint: 20 },
];

const ORDER_SEED = [
  { seedId: "ORD-1036", customer: "Bluepeak Coworking", lineItems: [{ product: "Task Chair – Mesh Back", qty: 24, price: 145 }], status: "Closed", date: "Jul 18" },
  { seedId: "ORD-1038", customer: "Crestwood Architects", lineItems: [{ product: "Conference Table – 8ft", qty: 2, price: 1240 }], status: "Shipped", date: "Jul 25" },
  { seedId: "ORD-1039", customer: "Harborline Logistics", lineItems: [{ product: "Filing Cabinet – 2 Drawer", qty: 15, price: 210 }], status: "Shipped", date: "Jul 28" },
  { seedId: "ORD-1040", customer: "Union Square Café Co.", lineItems: [{ product: "Reception Desk – L-Shape", qty: 1, price: 980 }], status: "Invoiced", date: "Jul 30" },
  { seedId: "ORD-1041", customer: "Meridian Dental Group", lineItems: [{ product: "Ergonomic Chair – Black", qty: 8, price: 210 }], status: "Invoiced", date: "Aug 1" },
  { seedId: "ORD-1042", customer: "Foothill Realty Partners", lineItems: [{ product: "Executive Desk – Walnut", qty: 5, price: 890 }], status: "Confirmed", date: "Aug 3" },
  { seedId: "ORD-1043", customer: "Bluepeak Coworking", lineItems: [{ product: "3-Shelf Bookcase – Oak", qty: 10, price: 175 }], status: "Confirmed", date: "Aug 4" },
  { seedId: "ORD-1044", customer: "Crestwood Architects", lineItems: [{ product: "Storage Locker – Steel", qty: 20, price: 130 }], status: "Confirmed", date: "Aug 5" },
  { seedId: "ORD-1045", customer: "Harborline Logistics", lineItems: [{ product: "Task Chair – Mesh Back", qty: 30, price: 145 }], status: "Draft", date: "Aug 6" },
  { seedId: "ORD-1046", customer: "Meridian Dental Group", lineItems: [{ product: "Reception Desk – L-Shape", qty: 2, price: 980 }], status: "Draft", date: "Aug 6" },
] as const;

const INCOMING_DRAFT_SEED = {
  customer: "Foothill Realty Partners",
  emailSubject: "Re: Office refresh — need quote for 12 desks",
  lineItems: [
    { product: "Executive Desk – Walnut", qty: 12, price: 890 },
    { product: "Ergonomic Chair – Black", qty: 12, price: 210 },
  ],
};

const INVOICE_SEED = [
  { seedId: "INV-2039", orderSeedId: "ORD-1036", status: "Paid", issueDate: "Jul 19", dueDate: "Aug 2" },
  { seedId: "INV-2041", orderSeedId: "ORD-1038", status: "Paid", issueDate: "Jul 26", dueDate: "Aug 9" },
  { seedId: "INV-2042", orderSeedId: "ORD-1039", status: "Sent", issueDate: "Jul 29", dueDate: "Aug 12" },
  { seedId: "INV-2043", orderSeedId: "ORD-1040", status: "Sent", issueDate: "Jul 31", dueDate: "Aug 14" },
  { seedId: "INV-2044", orderSeedId: "ORD-1041", status: "Overdue", issueDate: "Jul 20", dueDate: "Aug 3" },
  { seedId: "INV-2045", orderSeedId: "ORD-1042", status: "Draft", issueDate: "—", dueDate: "—" },
] as const;

const SHIPMENT_SEED = [
  { orderSeedId: "ORD-1036", invoiceSeedId: "INV-2039", status: "Delivered", date: "Jul 22" },
  { orderSeedId: "ORD-1038", invoiceSeedId: "INV-2041", status: "Delivered", date: "Jul 29" },
  { orderSeedId: "ORD-1039", invoiceSeedId: "INV-2042", status: "Dispatched", date: "Aug 5" },
  { orderSeedId: "ORD-1040", invoiceSeedId: "INV-2043", status: "Packed", date: "Aug 6" },
  { orderSeedId: "ORD-1041", invoiceSeedId: "INV-2044", status: "Draft", date: "—" },
  { orderSeedId: "ORD-1042", invoiceSeedId: null, status: "Draft", date: "—" },
] as const;

const JOB_SEED = [
  { orderSeedId: "ORD-1042", customer: "Foothill Realty Partners", product: "Executive Desk – Walnut", qty: 5, due: "Aug 8", status: "In Progress", progress: 65 },
  { orderSeedId: "ORD-1045", customer: "Harborline Logistics", product: "Task Chair – Mesh Back", qty: 30, due: "Aug 7", status: "In Progress", progress: 40 },
  { orderSeedId: null, customer: "Internal Stock", product: "Conference Table – 8ft", qty: 2, due: "Aug 12", status: "Planned", progress: 0 },
  { orderSeedId: "ORD-1044", customer: "Crestwood Architects", product: "Storage Locker – Steel", qty: 20, due: "Aug 9", status: "Planned", progress: 0 },
  { orderSeedId: "ORD-1041", customer: "Meridian Dental Group", product: "Ergonomic Chair – Black", qty: 8, due: "Aug 6", status: "Completed", progress: 100 },
  { orderSeedId: "ORD-1040", customer: "Union Square Café Co.", product: "Reception Desk – L-Shape", qty: 1, due: "Aug 14", status: "Planned", progress: 0 },
  { orderSeedId: "ORD-1043", customer: "Bluepeak Coworking", product: "3-Shelf Bookcase – Oak", qty: 10, due: "Aug 5", status: "Completed", progress: 100 },
] as const;

const now = Date.now();
const ACTIVITY_FEED_SEED = [
  { message: "ORD-1041 moved to Invoiced", occurredAt: new Date(now - 2 * 60 * 60 * 1000) },
  { message: "INV-2043 sent to Union Square Café Co.", occurredAt: new Date(now - 4 * 60 * 60 * 1000) },
  { message: "SHP-503 dispatched to Harborline Logistics", occurredAt: new Date(now - 5 * 60 * 60 * 1000) },
  { message: "New draft order ORD-1047 parsed from email", occurredAt: new Date(now - 8 * 60 * 60 * 1000) },
  { message: "JOB-305 marked Completed", occurredAt: new Date(now - 24 * 60 * 60 * 1000) },
  { message: "ORD-1044 confirmed by Crestwood Architects", occurredAt: new Date(now - 30 * 60 * 60 * 1000) },
];

const REVENUE_SERIES_SEED = [
  { week: "W1", revenue: 8300, orders: 14, sortOrder: 1 },
  { week: "W2", revenue: 10600, orders: 17, sortOrder: 2 },
  { week: "W3", revenue: 9200, orders: 15, sortOrder: 3 },
  { week: "W4", revenue: 12600, orders: 21, sortOrder: 4 },
  { week: "W5", revenue: 11600, orders: 19, sortOrder: 5 },
  { week: "W6", revenue: 14000, orders: 23, sortOrder: 6 },
  { week: "W7", revenue: 15000, orders: 25, sortOrder: 7 },
  { week: "W8", revenue: 13100, orders: 20, sortOrder: 8 },
];

async function main() {
  await connectDB();

  // --- Seed Dashboard Analytics (Activity Feed & Revenue Series) ---
  if ((await ActivityFeedEntry.countDocuments()) === 0) {
    await ActivityFeedEntry.insertMany(ACTIVITY_FEED_SEED);
    console.log(`[seed] created ${ACTIVITY_FEED_SEED.length} activity feed entries.`);
  } else {
    console.log("[seed] activity feed already present, skipping.");
  }

  if ((await RevenueSeriesPoint.countDocuments()) === 0) {
    await RevenueSeriesPoint.insertMany(REVENUE_SERIES_SEED);
    console.log(`[seed] created ${REVENUE_SERIES_SEED.length} revenue series points.`);
  } else {
    console.log("[seed] revenue series already present, skipping.");
  }

  // --- Seed Core Master Data (Customers, Products, Orders, etc.) ---
  if ((await Customer.countDocuments()) > 0) {
    console.log("[seed] master data already present, skipping.");
    await mongoose.disconnect();
    return;
  }

  await Customer.insertMany(CUSTOMER_SEED.map(({ name, contact, email, city }) => ({ name, contact, email, city })));
  await Supplier.insertMany(SUPPLIER_SEED);
  await Product.insertMany(PRODUCT_SEED);
  await InventoryItem.insertMany(INVENTORY_SEED);
  console.log(`[seed] created ${CUSTOMER_SEED.length} customers, ${SUPPLIER_SEED.length} suppliers, ${PRODUCT_SEED.length} products, ${INVENTORY_SEED.length} inventory items.`);

  const orderIdBySeedId = new Map<string, mongoose.Types.ObjectId>();
  const orderNumberBySeedId = new Map<string, string>();
  for (const o of ORDER_SEED) {
    const order = await Order.create({
      number: await generateRecordNumber("order", new Date()),
      customer: o.customer,
      lineItems: o.lineItems,
      status: o.status,
      date: parseDate(o.date),
    });
    orderIdBySeedId.set(o.seedId, order._id);
    orderNumberBySeedId.set(o.seedId, order.number);
  }
  console.log(`[seed] created ${ORDER_SEED.length} orders.`);

  await IncomingOrderDraft.create(INCOMING_DRAFT_SEED);
  console.log("[seed] created 1 incoming order draft.");

  const invoiceIdBySeedId = new Map<string, mongoose.Types.ObjectId>();
  for (const i of INVOICE_SEED) {
    const orderId = orderIdBySeedId.get(i.orderSeedId);
    if (!orderId) continue;
    const invoice = await Invoice.create({
      number: await generateRecordNumber("invoice", new Date()),
      orderId,
      status: i.status,
      issueDate: parseDate(i.issueDate),
      dueDate: parseDate(i.dueDate),
    });
    invoiceIdBySeedId.set(i.seedId, invoice._id);
  }
  console.log(`[seed] created ${INVOICE_SEED.length} invoices.`);

  for (const s of SHIPMENT_SEED) {
    const orderId = orderIdBySeedId.get(s.orderSeedId);
    if (!orderId) continue;
    await Shipment.create({
      number: await generateRecordNumber("shipment", new Date()),
      orderId,
      invoiceId: s.invoiceSeedId ? (invoiceIdBySeedId.get(s.invoiceSeedId) ?? null) : null,
      status: s.status,
      date: parseDate(s.date),
    });
  }
  console.log(`[seed] created ${SHIPMENT_SEED.length} shipments.`);

  for (const j of JOB_SEED) {
    const orderNumber = j.orderSeedId ? orderNumberBySeedId.get(j.orderSeedId) : undefined;
    await ProductionJob.create({
      number: await generateRecordNumber("job", new Date()),
      orderNumber: orderNumber || undefined,
      customer: j.customer,
      product: j.product,
      qty: j.qty,
      status: j.status,
      progress: j.progress,
      due: parseDate(j.due),
    });
  }
  console.log(`[seed] created ${JOB_SEED.length} production jobs.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
