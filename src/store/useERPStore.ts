"use client";

import { useContext, useSyncExternalStore } from "react";
import { ERPStoreContext } from "./ERPStoreProvider";
import type { ERPStore } from "./ERPStore";

/**
 * useERPStore — subscribes the calling component to the ERPStore instance
 * from context via useSyncExternalStore, so any component that reads store
 * data automatically re-renders after an action (moveOrderStatus,
 * addCustomer, ...) calls `notify()`. This is the one hook that touches
 * React; ERPStore itself (store/ERPStore.ts) has no React import.
 */
export function useERPStore(): ERPStore {
  const store = useContext(ERPStoreContext);
  if (!store) {
    throw new Error("useERPStore must be used within an <ERPStoreProvider>");
  }
  // ERPStore doesn't hold a single immutable snapshot object (state lives
  // across several repositories), so the snapshot passed to React is just
  // the version counter Observable bumps on every notify() — a primitive
  // that changes value each time, which is what makes React re-render.
  const getSnapshot = () => store.version;
  useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
  return store;
}
