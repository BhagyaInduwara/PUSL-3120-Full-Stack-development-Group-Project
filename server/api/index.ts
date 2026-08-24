import type { IncomingMessage, ServerResponse } from "node:http";
import "dotenv/config";
import { app } from "../src/app.js";
import { connectDB } from "../src/config/db.js";

/**
 * Vercel serverless entry point — a second, alternate way to run this same
 * Express app (src/server.ts is the original, for local dev and any
 * traditional-host deployment like Render/Railway). Vercel's Node runtime
 * calls this default export per request instead of the app ever calling
 * app.listen() itself; connectDB() is safe to call on every request since
 * it caches the connection (see config/db.ts) rather than reconnecting.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await connectDB();
  app(req, res);
}
