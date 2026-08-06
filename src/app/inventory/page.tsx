"use client";

import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { InventoryTable } from "@/components/inventory/InventoryTable";

export default function InventoryPage() {
  const store = useERPStore();

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Stock on hand across all finished goods."
        actions={<Button variant="secondary">Adjust stock</Button>}
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <InventoryTable items={store.inventory} />
      </div>
    </>
  );
}
