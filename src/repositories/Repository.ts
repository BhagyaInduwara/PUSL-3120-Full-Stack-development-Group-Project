import type { Entity } from "@/domain/Entity";

/**
 * Repository<T> — the contract every data-access class implements,
 * regardless of what's behind it. Today `InMemoryRepository` backs it with
 * a plain array; swapping to your real DB/API later means writing one new
 * class per repository that implements this same interface (e.g.
 * `SqlCustomerRepository implements Repository<Customer>`) — nothing above
 * the repository layer (ERPStore, components) has to change. This is the
 * Dependency Inversion half of SOLID: ERPStore depends on this interface,
 * never on a concrete storage mechanism. Order already made this swap for
 * real (see src/app/(app)/sales/page.tsx) — its repository was retired
 * rather than reimplemented, since the page talks to the backend directly.
 */
export interface Repository<T extends Entity> {
  findAll(): T[];
  findById(id: string): T | undefined;
}

/** Abstract base shared by every in-memory repository: array storage + lookup. */
export abstract class InMemoryRepository<T extends Entity> implements Repository<T> {
  protected readonly items: T[];

  protected constructor(seed: T[]) {
    this.items = [...seed];
  }

  findAll(): T[] {
    return [...this.items];
  }

  findById(id: string): T | undefined {
    return this.items.find((item) => item.id === id);
  }
}
