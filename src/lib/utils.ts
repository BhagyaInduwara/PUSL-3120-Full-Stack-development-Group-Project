import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely with conflict resolution.
 * Standard across modern SaaS component architectures (shadcn/ui, Linear-inspired systems).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
