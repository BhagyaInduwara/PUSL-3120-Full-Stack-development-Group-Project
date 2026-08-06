"use client";

import { createContext, useState, type ReactNode } from "react";
import { ERPStore } from "./ERPStore";

export const ERPStoreContext = createContext<ERPStore | null>(null);

/**
 * ERPStoreProvider — creates exactly one ERPStore instance for the app's
 * lifetime and puts it on context. `useState(() => new ERPStore())` (not
 * `useState(new ERPStore())`) is what guarantees the constructor runs once,
 * not on every render. Because this provider lives in the root layout, the
 * same store instance survives client-side navigation between routes.
 */
export function ERPStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new ERPStore());
  return <ERPStoreContext.Provider value={store}>{children}</ERPStoreContext.Provider>;
}
