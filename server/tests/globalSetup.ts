import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * Runs once, before any test file, in Jest's own orchestrating process —
 * not in a test worker. Starts one real (but in-memory, ephemeral) MongoDB
 * instance for the whole test run, so these are genuine integration tests
 * against a real Mongoose/MongoDB stack, not a mocked one, without ever
 * touching the real Atlas cluster or needing network/secrets in CI.
 *
 * process.env set here IS visible in test workers — Jest documents this as
 * the supported way to pass values from globalSetup to test files (env vars
 * are stringified and forwarded to every worker). env.ts (src/config/env.ts)
 * reads MONGODB_URI/JWT_SECRET at import time, so these must be set before
 * any test file imports src/app.ts.
 *
 * The MongoMemoryServer instance itself is stashed on globalThis rather
 * than a module-level variable — globalSetup.ts and globalTeardown.ts are
 * loaded as separate modules, but Jest runs both in the same orchestrating
 * process for one `jest` invocation, so globalThis is how the instance
 * survives from here to globalTeardown.ts's stop() call.
 */
export default async function globalSetup(): Promise<void> {
  const mongod = await MongoMemoryServer.create();
  (globalThis as Record<string, unknown>).__MONGOD__ = mongod;

  process.env.MONGODB_URI = mongod.getUri("flowerp_test");
  process.env.JWT_SECRET = "test-only-secret-do-not-use-in-production";
  process.env.NODE_ENV = "test";
}
