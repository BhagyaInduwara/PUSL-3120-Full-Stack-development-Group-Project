import fs from "node:fs";
import path from "node:path";

/**
 * Runs once per test file, before that file's own imports are evaluated —
 * critical here because config/env.ts validates required env vars eagerly
 * at module-load time (`required("MONGODB_URI")` etc. run as soon as
 * anything imports it), so MONGODB_URI/JWT_SECRET must already be set
 * before a test file's `import { app } from "../app.js"` line runs.
 *
 * Deliberately does NOT load the real server/.env — these tests must never
 * be able to touch the real Atlas cluster, only the ephemeral in-memory
 * instance globalSetup.ts just started.
 */
const uriFile = path.join(__dirname, ".mongo-uri.tmp");
process.env.MONGODB_URI = fs.readFileSync(uriFile, "utf-8").trim();
process.env.JWT_SECRET = "test-only-jwt-secret-do-not-use-in-real-env";
process.env.NODE_ENV = "test";
