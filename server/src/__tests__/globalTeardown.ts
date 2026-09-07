import fs from "node:fs";
import path from "node:path";
import type { MongoMemoryServer } from "mongodb-memory-server";

/**
 * globalSetup/globalTeardown share the same process, so the MongoMemoryServer
 * instance itself can travel via a global (Jest's own documented pattern for
 * this exact case) — but the actual test FILES run in separate worker
 * processes that never see this global, which is why globalSetup also wrote
 * the connection URI to a temp file for setupEnv.ts (a per-worker setupFiles
 * script) to read back into process.env before any test module is imported.
 */
export default async function globalTeardown(): Promise<void> {
  const mongod = (globalThis as unknown as { __MONGOD__?: MongoMemoryServer }).__MONGOD__;
  await mongod?.stop();

  const uriFile = path.join(__dirname, ".mongo-uri.tmp");
  if (fs.existsSync(uriFile)) fs.unlinkSync(uriFile);
}
