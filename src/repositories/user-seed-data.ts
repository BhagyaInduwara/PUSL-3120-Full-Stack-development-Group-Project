import "server-only";
import bcrypt from "bcryptjs";
import type { UserProps } from "@/domain/User";

/**
 * Seed data for the one built-in account. Kept in its own file (separate
 * from seed-data.ts) and guarded by `import "server-only"` so a password
 * hash can never end up in a client bundle, even by accident — seed-data.ts
 * is reachable from ERPStore, which is client-side; this file is only ever
 * reachable from UserRepository.
 *
 * The same credentials are seeded into DB_V1_Insert.sql via Postgres's
 * pgcrypto `crypt(..., gen_salt('bf'))`, which produces a bcrypt hash
 * wire-compatible with this one (see PasswordHasher.ts).
 */
export const USER_SEED: UserProps[] = [
  {
    id: "user-admin",
    username: "admin",
    passwordHash: bcrypt.hashSync("admin@123", 10),
    role: "admin",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];
