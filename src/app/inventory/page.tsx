"use client";

import { useState } from "react";
import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import {
  AdjustStockModal,
  type AdjustStockData,
} from "@/components/inventory/AdjustStockModal";

export default function InventoryPage() {
  const store = useERPStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdjustStock = (data: AdjustStockData) => {
    console.log("Stock adjustment submitted:", data);
    
    // will add the actual Firebase saving logic later!
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Stock on hand across all finished goods."
        actions={
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            Adjust stock
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <InventoryTable items={store.inventory} />
      </div>

      <AdjustStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAdjustStock}
        inventoryList={store.inventory}
      />
    </>
  );
}
