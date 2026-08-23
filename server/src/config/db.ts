import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri);
  console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);
}
