/**
 * One-time (but idempotent) migration: prepends the type prefix
 * (ORD-/INV-/SHP-/JOB-) onto every existing `number` that predates it —
 * see ../utils/recordNumber.ts for why the prefix exists. Skips any
 * document whose number is already prefixed, so it's safe to re-run.
 *
 * Run with: npm run migrate:number-prefixes
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

const PREFIX_BY_COLLECTION: Record<string, string> = {
  orders: "ORD",
  invoices: "INV",
  shipments: "SHP",
  productionjobs: "JOB",
};

async function addPrefix(collectionName: string): Promise<void> {
  const prefix = PREFIX_BY_COLLECTION[collectionName];
  const collection = mongoose.connection.collection(collectionName);
  const docs = await collection.find({ number: { $exists: true } }).toArray();

  let count = 0;
  for (const doc of docs) {
    if (typeof doc.number !== "string" || doc.number.startsWith(`${prefix}-`)) continue;
    await collection.updateOne({ _id: doc._id }, { $set: { number: `${prefix}-${doc.number}` } });
    count++;
  }

  console.log(`[prefix] ${collectionName}: updated ${count} document(s).`);
}

async function main() {
  await connectDB();
  for (const collectionName of Object.keys(PREFIX_BY_COLLECTION)) {
    await addPrefix(collectionName);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[prefix] failed:", err);
  process.exit(1);
});
