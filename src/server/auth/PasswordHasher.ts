import "server-only";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * PasswordHasher — the one place bcrypt is called from. Nothing else in
 * the app should import bcryptjs directly; routing every hash/verify
 * through this class means the hashing algorithm/cost factor can change
 * in one spot later (and matches the bcrypt-compatible `crypt(..., gen_salt('bf'))`
 * hashes DB_V1_Insert.sql seeds via Postgres's pgcrypto extension — the two
 * are wire-compatible, so a future SqlUserRepository can verify passwords
 * hashed by either side).
 */
export class PasswordHasher {
  static async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  static async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
