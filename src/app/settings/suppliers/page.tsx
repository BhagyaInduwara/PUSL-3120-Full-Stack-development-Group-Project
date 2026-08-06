"use client";

import { useERPStore } from "@/store/useERPStore";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import type { Supplier } from "@/domain/Supplier";

const columns: Column<Supplier>[] = [
  { header: "Supplier", cell: (s) => <span className="font-semibold">{s.name}</span> },
  { header: "Category", cell: (s) => s.category, className: "text-[var(--color-neutral-500)]" },
  { header: "Contact", cell: (s) => s.contact },
  { header: "Lead time", cell: (s) => s.leadTime, className: "text-[var(--color-neutral-500)]" },
];

export default function SuppliersSettingsPage() {
  const store = useERPStore();

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button variant="primary">Add supplier</Button>
      </div>
      <Table columns={columns} rows={store.suppliers} rowKey={(s) => s.id} />
    </>
  );
}
