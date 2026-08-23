/**
 * One-time (but idempotent) backfill: assigns a human-readable `number`
 * (see ../utils/recordNumber.ts) to any existing Order/Invoice/Shipment/
 * ProductionJob document that predates the field, in creation order, using
 * each document's own createdAt so the assigned numbers land on the right
 * date and stay consistent with numbers newly-created records get.
 *
 * Run with: npm run backfill:record-numbers
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { generateRecordNumber } from "../utils/recordNumber.js";

async function backfillCollection(collectionName: string, type: string): Promise<void> {
  const collection = mongoose.connection.collection(collectionName);
  const docs = await collection.find({ number: { $exists: false } }).sort({ createdAt: 1 }).toArray();

  let count = 0;
  for (const doc of docs) {
    const number = await generateRecordNumber(type, doc.createdAt ?? new Date());
    await collection.updateOne({ _id: doc._id }, { $set: { number } });
    count++;
  }

  console.log(`[backfill] ${collectionName}: assigned numbers to ${count} document(s).`);
}

async function main() {
  await connectDB();
  await backfillCollection("orders", "order");
  await backfillCollection("invoices", "invoice");
  await backfillCollection("shipments", "shipment");
  await backfillCollection("productionjobs", "job");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[backfill] failed:", err);
  process.exit(1);
});
