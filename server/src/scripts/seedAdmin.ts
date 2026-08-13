/**
 * Seeds the one built-in admin account (admin / admin@123) — same
 * credentials as the Next.js in-memory UserRepository seeds today and
 * DB_V1_Insert.sql seeds into Supabase, so login works identically
 * regardless of which backend is currently wired up. Safe to re-run:
 * upserts rather than duplicating.
 *
 * Run with: npm run seed
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/passwordHasher.js";

async function main() {
  await connectDB();

  const existing = await User.findOne({ username: "admin" });
  if (existing) {
    console.log("[seed] admin user already exists, skipping.");
  } else {
    await User.create({
      username: "admin",
      passwordHash: await hashPassword("admin@123"),
      role: "admin",
    });
    console.log("[seed] created admin user (admin / admin@123).");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
