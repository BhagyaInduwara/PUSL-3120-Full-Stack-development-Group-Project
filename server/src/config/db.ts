import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Cached across calls (not just the first one) so this is safe to call on
 * every request, not only once at process startup. That matters for the
 * serverless deployment (api/index.ts) — a fresh connection per invocation
 * would exhaust Atlas's connection limit almost immediately, whereas a
 * warm serverless container reuses this cached promise just like the
 * long-running server.ts process already does implicitly.
 */
let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<void> {
  if (!connectionPromise) {
    mongoose.set("strictQuery", true);
    connectionPromise = mongoose.connect(env.mongodbUri).then((m) => {
      console.log(`[db] connected to MongoDB (${m.connection.name})`);
      return m;
    });
  }
  await connectionPromise;
}
