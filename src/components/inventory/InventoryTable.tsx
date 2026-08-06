import type { InventoryItem } from "@/domain/InventoryItem";
import { Table, type Column } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";

const columns: Column<InventoryItem>[] = [
  { header: "SKU", cell: (p) => p.sku, className: "text-[var(--color-neutral-500)]" },
  { header: "Product", cell: (p) => p.name },
  { header: "Category", cell: (p) => p.category, className: "text-[var(--color-neutral-500)]" },
  {
    header: "On hand",
    cell: (p) => (
      <span
        className="font-semibold"
        style={{ color: p.isLow ? "var(--color-accent-300)" : "var(--color-text)" }}
      >
        {p.qty}
      </span>
    ),
  },
  {
    header: "Stock level",
    className: "min-w-[120px]",
    cell: (p) => (
      <div className="w-full h-1.5 rounded-full bg-[var(--color-neutral-800)] overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${p.stockPercent}%`,
            background: p.isLow ? "var(--color-accent-400)" : "var(--color-accent-800)",
          }}
        />
      </div>
    ),
  },
  { header: "", cell: (p) => (p.isLow ? <Tag variant="outline">Low stock</Tag> : null) },
];

/** InventoryTable — stock-on-hand list with a reorder-point progress bar per row. */
export function InventoryTable({ items }: { items: InventoryItem[] }) {
  return <Table columns={columns} rows={items} rowKey={(p) => p.sku} />;
}
