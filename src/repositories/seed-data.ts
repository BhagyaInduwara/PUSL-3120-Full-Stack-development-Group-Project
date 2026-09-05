/**
 * Seed data — ported 1:1 from the sample state in FlowERP Dashboard.dc.html
 * (`class Component extends DCLogic { state = {...} }`). This is the only
 * file that should change when swapping in a real database: repositories
 * read from here today, and from your API/DB client once it's wired up.
 */
import type { InvoiceProps } from "@/domain/Invoice";
import type { ShipmentProps } from "@/domain/Shipment";
import type { InventoryItemProps } from "@/domain/InventoryItem";
import type { CustomerProps } from "@/domain/Customer";
import type { SupplierProps } from "@/domain/Supplier";
import type { ProductProps } from "@/domain/Product";

// Orders and incoming order drafts no longer have mock seed data here — the
// Sales & Orders screen (src/app/(app)/sales/page.tsx) reads and writes them
// directly against the real backend (/api/orders, /api/order-drafts) instead
// of an in-memory repository. See OrderRepository's removal in this same
// change for the rest of that retirement.

export const INVOICE_SEED: InvoiceProps[] = [
  { id: "INV-2039", number: "INV-2039", orderId: "ORD-1036", status: "Paid", issueDate: "Jul 19", dueDate: "Aug 2" },
  { id: "INV-2041", number: "INV-2041", orderId: "ORD-1038", status: "Paid", issueDate: "Jul 26", dueDate: "Aug 9" },
  { id: "INV-2042", number: "INV-2042", orderId: "ORD-1039", status: "Sent", issueDate: "Jul 29", dueDate: "Aug 12" },
  { id: "INV-2043", number: "INV-2043", orderId: "ORD-1040", status: "Sent", issueDate: "Jul 31", dueDate: "Aug 14" },
  { id: "INV-2044", number: "INV-2044", orderId: "ORD-1041", status: "Overdue", issueDate: "Jul 20", dueDate: "Aug 3" },
  { id: "INV-2045", number: "INV-2045", orderId: "ORD-1042", status: "Draft", issueDate: "—", dueDate: "—" },
];

export const INVENTORY_SEED: InventoryItemProps[] = [
  { sku: "DSK-EXW", name: "Executive Desk – Walnut", category: "Desks", qty: 14, reorderPoint: 10 },
  { sku: "CHR-MSH", name: "Task Chair – Mesh Back", category: "Seating", qty: 6, reorderPoint: 20 },
  { sku: "BKC-OAK", name: "3-Shelf Bookcase – Oak", category: "Storage", qty: 22, reorderPoint: 8 },
  { sku: "FIL-2DR", name: "Filing Cabinet – 2 Drawer", category: "Storage", qty: 3, reorderPoint: 12 },
  { sku: "RCP-LSH", name: "Reception Desk – L-Shape", category: "Desks", qty: 9, reorderPoint: 5 },
  { sku: "CHR-ERG", name: "Ergonomic Chair – Black", category: "Seating", qty: 41, reorderPoint: 15 },
  { sku: "TBL-CNF", name: "Conference Table – 8ft", category: "Tables", qty: 2, reorderPoint: 4 },
  { sku: "LCK-STL", name: "Storage Locker – Steel", category: "Storage", qty: 55, reorderPoint: 20 },
];

export const SHIPMENT_SEED: ShipmentProps[] = [
  { id: "SHP-501", number: "SHP-501", orderId: "ORD-1036", invoiceId: "INV-2039", invoiceNumber: "INV-2039", status: "Delivered", date: "Jul 22" },
  { id: "SHP-502", number: "SHP-502", orderId: "ORD-1038", invoiceId: "INV-2041", invoiceNumber: "INV-2041", status: "Delivered", date: "Jul 29" },
  { id: "SHP-503", number: "SHP-503", orderId: "ORD-1039", invoiceId: "INV-2042", invoiceNumber: "INV-2042", status: "Dispatched", date: "Aug 5" },
  { id: "SHP-504", number: "SHP-504", orderId: "ORD-1040", invoiceId: "INV-2043", invoiceNumber: "INV-2043", status: "Packed", date: "Aug 6" },
  { id: "SHP-505", number: "SHP-505", orderId: "ORD-1041", invoiceId: "INV-2044", invoiceNumber: "INV-2044", status: "Draft", date: "—" },
  { id: "SHP-506", number: "SHP-506", orderId: "ORD-1042", invoiceId: null, invoiceNumber: null, status: "Draft", date: "—" },
];

// Production jobs no longer have mock seed data here — the Production
// screen (src/app/(app)/production/page.tsx) reads and writes them
// directly against the real backend (/api/production-jobs) instead of an
// in-memory repository. See ProductionJobRepository's removal for the
// rest of that retirement.

export const CUSTOMER_SEED: CustomerProps[] = [
  { id: "cust-bluepeak", name: "Bluepeak Coworking", contact: "Sam Ortiz", email: "sam@bluepeakcoworking.com", city: "Denver, CO" },
  { id: "cust-crestwood", name: "Crestwood Architects", contact: "Nadia Fell", email: "nadia@crestwoodarch.com", city: "Portland, OR" },
  { id: "cust-harborline", name: "Harborline Logistics", contact: "Ravi Chandran", email: "ravi@harborline.co", city: "Newark, NJ" },
  { id: "cust-unionsquare", name: "Union Square Café Co.", contact: "Ella Munro", email: "ella@unionsquarecafe.com", city: "Austin, TX" },
  { id: "cust-meridian", name: "Meridian Dental Group", contact: "Dr. Alan Kwan", email: "alan@meridiandental.com", city: "Sacramento, CA" },
  { id: "cust-foothill", name: "Foothill Realty Partners", contact: "Grace Lin", email: "grace@foothillrealty.com", city: "Boise, ID" },
];

export const SUPPLIER_SEED: SupplierProps[] = [
  { id: "sup-cascade", name: "Cascade Hardwoods Ltd", category: "Lumber", contact: "Marcus Voss", leadTime: "3 weeks" },
  { id: "sup-steelcore", name: "Steelcore Fabrication", category: "Metal frames", contact: "Lena Ruiz", leadTime: "2 weeks" },
  { id: "sup-pacific", name: "Pacific Foam & Upholstery", category: "Seating materials", contact: "Owen Patel", leadTime: "10 days" },
  { id: "sup-northgate", name: "Northgate Casters Inc", category: "Hardware", contact: "Faye Dumont", leadTime: "1 week" },
];

export const PRODUCT_SEED: ProductProps[] = [
  { sku: "DSK-EXW", name: "Executive Desk – Walnut", category: "Desks", price: 890 },
  { sku: "CHR-MSH", name: "Task Chair – Mesh Back", category: "Seating", price: 145 },
  { sku: "BKC-OAK", name: "3-Shelf Bookcase – Oak", category: "Storage", price: 175 },
  { sku: "FIL-2DR", name: "Filing Cabinet – 2 Drawer", category: "Storage", price: 210 },
  { sku: "RCP-LSH", name: "Reception Desk – L-Shape", category: "Desks", price: 980 },
  { sku: "CHR-ERG", name: "Ergonomic Chair – Black", category: "Seating", price: 210 },
  { sku: "TBL-CNF", name: "Conference Table – 8ft", category: "Tables", price: 1240 },
  { sku: "LCK-STL", name: "Storage Locker – Steel", category: "Storage", price: 130 },
];

export const ACTIVITY_FEED_SEED: { text: string; time: string }[] = [
  { text: "ORD-1041 moved to Invoiced", time: "Today, 2h ago" },
  { text: "INV-2043 sent to Union Square Café Co.", time: "Today, 4h ago" },
  { text: "SHP-503 dispatched to Harborline Logistics", time: "Today, 5h ago" },
  { text: "New draft order ORD-1047 parsed from email", time: "Today, 9:14 AM" },
  { text: "JOB-305 marked Completed", time: "Yesterday" },
  { text: "ORD-1044 confirmed by Crestwood Architects", time: "Yesterday" },
];

/** Weekly orders/revenue series behind the Dashboard bar+line chart (8 weeks, W1-W8). */
export const REVENUE_SERIES_SEED: { week: string; revenue: number; orders: number }[] = [
  { week: "W1", revenue: 8300, orders: 14 },
  { week: "W2", revenue: 10600, orders: 17 },
  { week: "W3", revenue: 9200, orders: 15 },
  { week: "W4", revenue: 12600, orders: 21 },
  { week: "W5", revenue: 11600, orders: 19 },
  { week: "W6", revenue: 14000, orders: 23 },
  { week: "W7", revenue: 15000, orders: 25 },
  { week: "W8", revenue: 13100, orders: 20 },
];
