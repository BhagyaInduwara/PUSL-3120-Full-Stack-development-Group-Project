"use client";

import { useState, useEffect } from "react";
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
  
  // State to hold the real data
  const [realInventory, setRealInventory] = useState<any[]>([]);

  // Fetch the live data when the page loads
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/inventory", {
          credentials: "include" 
        });
        
        if (response.ok) {
          const data = await response.json();
          setRealInventory(data.inventory);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };

    loadInventory();
  }, []);

  const handleAdjustStock = async (data: AdjustStockData) => {
    try {
      const response = await fetch("http://localhost:4000/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error("Failed to save inventory item.");
      }
    } catch (error) {
      console.error("Error saving stock:", error);
    }
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
        <InventoryTable items={realInventory} />
      </div>

      <AdjustStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAdjustStock}
        inventoryList={realInventory}
      />
    </>
  );
}