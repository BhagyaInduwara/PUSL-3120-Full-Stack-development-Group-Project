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
    connectionPromise = mongoose
      .connect(env.mongodbUri, {
        // Explicit pool bounds rather than the driver's bare defaults: a cap
        // that's safe for Atlas's free/shared-tier connection limit even
        // when several warm serverless containers each hold their own
        // cached connection (see the comment above), and a floor so a
        // container isn't paying a fresh-connection round trip on its next
        // request after a quiet period.
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 10_000,
      })
      .then((m) => {
        console.log(`[db] connected to MongoDB (${m.connection.name})`);
        return m;
      });
  }
  await connectionPromise;
}
