import type { MongoMemoryServer } from "mongodb-memory-server";

/** Stops the in-memory MongoDB instance started in globalSetup.ts. See that file's comment for why globalThis is how the instance gets here. */
export default async function globalTeardown(): Promise<void> {
  const mongod = (globalThis as Record<string, unknown>).__MONGOD__ as MongoMemoryServer | undefined;
  await mongod?.stop();
}
