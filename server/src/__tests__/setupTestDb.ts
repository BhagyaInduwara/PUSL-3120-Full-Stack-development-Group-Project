import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

beforeAll(async () => {
  await connectDB();
});

/** Test isolation: no test should see data left behind by a previous one. */
afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.close();
});
