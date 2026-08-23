/**
 * One-time (but idempotent) migration: rewrites existing Order documents
 * from the old flat {product,qty,price} shape to the new
 * {lineItems:[{product,qty,price}]} shape, IN PLACE (same _id), so
 * Invoice/Shipment documents that ref:"Order" this _id keep working
 * unchanged.
 *
 * Uses the RAW driver, not the Order Mongoose model — a document hydrated
 * through the new schema wouldn't expose the old product/qty/price fields
 * at all (they're not in the new schema), so there'd be nothing to read the
 * old values from. The raw driver sees the document exactly as stored,
 * regardless of which schema version the app currently has loaded.
 *
 * Run with: npm run migrate:order-lineitems
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

async function main() {
  await connectDB();
  const orders = mongoose.connection.collection("orders");

  const cursor = orders.find({ lineItems: { $exists: false } });

  let migrated = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    if (typeof doc.product !== "string" || typeof doc.qty !== "number" || typeof doc.price !== "number") {
      console.warn(`[migrate] skipping ${doc._id} — missing/invalid product/qty/price.`);
      skipped++;
      continue;
    }

    await orders.updateOne(
      { _id: doc._id },
      {
        $set: { lineItems: [{ product: doc.product, qty: doc.qty, price: doc.price }] },
        $unset: { product: "", qty: "", price: "" },
      }
    );
    migrated++;
  }

  console.log(`[migrate] done. migrated: ${migrated}, skipped: ${skipped}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
