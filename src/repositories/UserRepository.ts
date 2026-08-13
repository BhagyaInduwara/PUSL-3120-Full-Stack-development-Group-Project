import "server-only";
import { InMemoryRepository } from "./Repository";
import { User } from "@/domain/User";
import { USER_SEED } from "./user-seed-data";

/**
 * UserRepository — same Repository<T> shape as every other repository (see
 * CLAUDE.md "The data layer"), but never imported from a "use client" file:
 * `import "server-only"` here (and in User.ts's password hash path,
 * PasswordHasher.ts, user-seed-data.ts) makes that a build error rather
 * than a hope. Auth code reaches this through the module-level
 * `userRepository` singleton below, never through ERPStore.
 */
export class UserRepository extends InMemoryRepository<User> {
  constructor(seed = USER_SEED) {
    super(seed.map((props) => new User(props)));
  }

  findByUsername(username: string): User | undefined {
    const needle = username.trim().toLowerCase();
    return this.items.find((user) => user.username.toLowerCase() === needle);
  }

  add(user: User): void {
    this.items.push(user);
  }

  nextId(): string {
    return `user-${crypto.randomUUID().slice(0, 8)}`;
  }
}

/**
 * Anchored on `globalThis` rather than a plain `export const`, because a
 * plain module-level singleton is NOT guaranteed to be the same instance
 * everywhere: Next.js can give Route Handlers and Server Components
 * separate module graphs (observed here in dev under Turbopack — a user
 * created via /api/users was visible to curl hitting that route directly,
 * but invisible to the /settings/users Server Component reading the
 * "same" `userRepository` import a moment later), and in production most
 * deployments run each route as its own serverless invocation with no
 * shared memory at all. `globalThis` is the one thing guaranteed to be the
 * same object within a single process/isolate regardless of which module
 * graph asked for it — the standard fix for this class of bug (the same
 * pattern Prisma's own Next.js docs recommend for its client instance).
 * A real database removes the need for this entirely, since the database
 * itself becomes the shared state instead of process memory.
 */
const globalForUserRepository = globalThis as unknown as { __userRepository?: UserRepository };

export const userRepository: UserRepository =
  globalForUserRepository.__userRepository ?? (globalForUserRepository.__userRepository = new UserRepository());
