import type { ReactNode } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * Table<T> — one generic component drives every list screen (Sales table
 * view, Invoicing, Inventory, Shipments, Settings tabs).
 * Hand-crafted SaaS styling with sticky header support, crisp typography,
 * smooth hover states, and tabular number formatting.
 */
export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = "No records found",
  className = "",
}: TableProps<T>) {
  return (
    <Card elevation="sm" padded={false} className={cn("overflow-hidden border border-[var(--color-divider)]", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)]">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={cn(
                    "text-left text-[11px] tracking-wider uppercase text-[var(--color-neutral-400)] px-4 py-3 font-semibold select-none",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-divider)]/60">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-[var(--color-neutral-400)]"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <p className="font-medium text-sm text-[var(--color-text)] opacity-70">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "group transition-colors duration-100 hover:bg-[var(--color-surface-hover)]",
                    onRowClick && "cursor-pointer active:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)]"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={cn(
                        "px-4 py-3 text-[var(--color-text)] tabular-nums align-middle",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.className
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
