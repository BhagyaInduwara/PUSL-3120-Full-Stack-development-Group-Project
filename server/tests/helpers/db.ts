import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import type { Express } from "express";

let mongoServer: MongoMemoryServer;
let app: Express;

/**
 * Starts an in-memory MongoDB instance, sets the required env vars,
 * then dynamically imports app.ts (which calls connectDB() at the top level).
 * Returns the Express app for use with Supertest.
 */
export async function connectTestDB(): Promise<Express> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Must be set BEFORE app.ts is imported — env.ts reads these at module load
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "test-secret-key-for-jest";
  process.env.CLIENT_ORIGIN = "http://localhost:3000";

  // Dynamic import so app.ts's top-level `await connectDB()` uses our in-memory URI
  const appModule = await import("../../src/app.js");
  app = appModule.app;

  return app;
}

/**
 * Drops all collections between tests for full isolation.
 */
export async function clearTestDB(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Disconnects Mongoose and stops the in-memory MongoDB server.
 */
export async function closeTestDB(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}
