/**
 * Observable — minimal pub/sub base class. ERPStore extends this instead of
 * relying on React state directly, so the store stays a plain class that
 * could run outside React entirely (a script, a test, a future server
 * process). React only enters the picture in useERPStore, which subscribes
 * via `useSyncExternalStore`.
 */
export abstract class Observable {
  private listeners = new Set<() => void>();

  /** Bumped on every notify() so useSyncExternalStore's snapshot comparison
   *  (Object.is) sees a change and actually re-renders subscribers. */
  private _version = 0;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  get version(): number {
    return this._version;
  }

  protected notify(): void {
    this._version++;
    for (const listener of this.listeners) listener();
  }
}
