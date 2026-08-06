import type { ReactNode } from "react";
import { Card } from "./Card";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

/**
 * Table<T> — one generic component drives every list screen (Sales table
 * view, Invoicing, Inventory, Shipments, Settings tabs). Callers supply
 * typed column definitions instead of the table re-implementing per-page
 * markup, which is what keeps each page's own file small.
 */
export function Table<T>({ columns, rows, rowKey, onRowClick }: TableProps<T>) {
  return (
    <Card elevation="sm" padded={false}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-divider)]">
            {columns.map((col) => (
              <th
                key={col.header}
                className="text-left text-[11px] tracking-[0.08em] uppercase text-[var(--color-neutral-500)] p-2 font-normal"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-[color-mix(in_srgb,var(--color-text)_8%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((col) => (
                <td key={col.header} className={`p-2 ${col.className ?? ""}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
