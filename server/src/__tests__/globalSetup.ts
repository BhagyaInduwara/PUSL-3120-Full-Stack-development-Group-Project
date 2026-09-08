import fs from "node:fs";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * Runs once before the whole test run, in the same process as
 * globalTeardown (but a different process than the actual test files) —
 * see globalTeardown.ts for why the Mongo URI has to be handed off via a
 * temp file rather than process.env or a global variable.
 */
export default async function globalSetup(): Promise<void> {
  const mongod = await MongoMemoryServer.create();
  (globalThis as unknown as { __MONGOD__: MongoMemoryServer }).__MONGOD__ = mongod;

  fs.writeFileSync(path.join(__dirname, ".mongo-uri.tmp"), mongod.getUri(), "utf-8");
}
