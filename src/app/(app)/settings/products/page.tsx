"use client";

import { useERPStore } from "@/store/useERPStore";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/domain/Product";

const columns: Column<Product>[] = [
  { header: "SKU", cell: (p) => p.sku, className: "text-[var(--color-neutral-500)]" },
  { header: "Name", cell: (p) => <span className="font-semibold">{p.name}</span> },
  { header: "Category", cell: (p) => p.category, className: "text-[var(--color-neutral-500)]" },
  { header: "Unit price", cell: (p) => p.priceFormatted },
];

export default function ProductsSettingsPage() {
  const store = useERPStore();

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button variant="primary">Add product</Button>
      </div>
      <Table columns={columns} rows={store.products} rowKey={(p) => p.sku} />
    </>
  );
}
