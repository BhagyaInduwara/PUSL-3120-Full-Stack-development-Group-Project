/**
 * Entity — abstract base class for every domain object that has a stable
 * identity (as opposed to a value object like Money, which is compared by
 * value). Centralizing `id` here is what lets InMemoryRepository<T> work
 * generically across every repository in src/repositories.
 */
export abstract class Entity<ID extends string = string> {
  constructor(public readonly id: ID) {}

  equals(other: Entity<ID> | undefined | null): boolean {
    return other instanceof Entity && other.id === this.id;
  }
}
