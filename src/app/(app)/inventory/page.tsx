"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AdjustStockModal, type AdjustStockData } from "@/components/inventory/AdjustStockModal";
import { InventoryItem } from "@/domain/InventoryItem";

import { API_URL } from "@/lib/apiUrl";
import { fetchWithCache } from "@/lib/offline";

interface ApiInventoryItem {
  _id: string;
  sku: string;
  name: string;
  category: string;
  qty: number;
  reorderPoint: number;
}

interface FetchedInventory {
  items: InventoryItem[];
  mongoIdBySku: Record<string, string>;
}

/** Pure fetch, no setState — uses fetchWithCache for offline resilience while mutation handlers reuse the same fetch logic. */
async function fetchInventory(): Promise<FetchedInventory> {
  try {
    const { data } = await fetchWithCache<{ inventory: ApiInventoryItem[] }>(`${API_URL}/api/inventory`);
    const apiItems = data.inventory ?? [];

    return {
      items: apiItems.map(
        (item) =>
          new InventoryItem({
            sku: item.sku,
            name: item.name,
            category: item.category,
            qty: item.qty,
            reorderPoint: item.reorderPoint,
          })
      ),
      mongoIdBySku: Object.fromEntries(apiItems.map((item) => [item.sku, item._id])),
    };
  } catch (error) {
    console.warn("Failed to fetch inventory:", error);
    return { items: [], mongoIdBySku: {} };
  }
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  // InventoryItem uses sku as its id (matching the rest of the app), but PUT
  // requests need the real Mongo _id — kept separately rather than smuggled
  // into the domain class, which has no field for it.
  const [mongoIdBySku, setMongoIdBySku] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await fetchInventory();
        setItems(fetched.items);
        setMongoIdBySku(fetched.mongoIdBySku);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    })();
  }, []);

  // AdjustStockData is a delta ({ sku, actionType, quantity, reason }), not a
  // full item — apply it to the existing item's qty and PUT the whole record
  // (the update endpoint expects sku/name/category/qty/reorderPoint together).
  const handleAdjustStock = async (data: AdjustStockData) => {
    const item = items.find((i) => i.sku === data.sku);
    const mongoId = mongoIdBySku[data.sku];
    if (!item || !mongoId) return;

    const delta = data.actionType === "add" ? data.quantity : -data.quantity;
    const newQty = Math.max(0, item.qty + delta);

    try {
      const response = await fetch(`${API_URL}/api/inventory/${mongoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sku: item.sku,
          name: item.name,
          category: item.category,
          qty: newQty,
          reorderPoint: item.reorderPoint,
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        const fetched = await fetchInventory();
        setItems(fetched.items);
        setMongoIdBySku(fetched.mongoIdBySku);
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
        <InventoryTable items={items} />
      </div>

      <AdjustStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAdjustStock}
        inventoryList={items}
      />
    </>
  );
}
