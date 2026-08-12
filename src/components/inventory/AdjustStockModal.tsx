"use client";

import { useState } from "react";
import type { InventoryItem } from "@/domain/InventoryItem";
import { Button } from "@/components/ui/Button";

export interface AdjustStockData {
  sku: string;
  actionType: "add" | "remove";
  quantity: number;
  reason: string;
}

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AdjustStockData) => void;
  inventoryList: InventoryItem[];
}

export function AdjustStockModal({
  isOpen,
  onClose,
  onSave,
  inventoryList,
}: AdjustStockModalProps) {
  const [sku, setSku] = useState("");
  const [actionType, setActionType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("New Shipment");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku) return;

    onSave({
      sku,
      actionType,
      quantity: Number(quantity),
      reason,
    });

    // Reset form & close
    setSku("");
    setQuantity(1);
    setActionType("add");
    setReason("New Shipment");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1b1c2b] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Adjust Stock</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection Dropdown */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Select Product
            </label>
            <select
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full bg-[#131422] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="" disabled className="bg-[#1b1c2b]">
                Select a product...
              </option>
              {inventoryList.map((item) => (
                <option key={item.sku} value={item.sku} className="bg-[#1b1c2b]">
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Adjustment Toggle (Add / Remove) & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Adjustment Type
              </label>
              <div className="flex bg-[#131422] border border-white/10 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setActionType("add")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    actionType === "add"
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Add (+)
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("remove")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    actionType === "remove"
                      ? "bg-rose-600/30 text-rose-300 border border-rose-500/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Remove (-)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#131422] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Reason Dropdown */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#131422] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="New Shipment" className="bg-[#1b1c2b]">
                New Shipment
              </option>
              <option value="Damaged Goods" className="bg-[#1b1c2b]">
                Damaged Goods
              </option>
              <option value="Audit" className="bg-[#1b1c2b]">
                Audit
              </option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}