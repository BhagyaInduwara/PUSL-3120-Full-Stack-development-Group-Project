import { Schema, model } from "mongoose";

/**
 * Counter — one document per (record type, year), atomically incremented to
 * hand out the next sequence number for human-readable record numbers (see
 * ../utils/recordNumber.ts). findOneAndUpdate + $inc + upsert is the
 * standard atomic-counter pattern in Mongoose: concurrent requests can never
 * read-then-write the same value, since the increment happens in one atomic
 * operation on the database side rather than in application code.
 */
const counterSchema = new Schema({
  key: { type: String, required: true, unique: true }, // e.g. "order:2026"
  seq: { type: Number, default: 0 },
});

export const Counter = model("Counter", counterSchema);

export async function nextSequence(type: string, year: number): Promise<number> {
  const key = `${type}:${year}`;
  const doc = await Counter.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return doc.seq;
}
