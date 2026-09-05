import { InMemoryRepository } from "./Repository";
import { InventoryItem } from "@/domain/InventoryItem";
import { INVENTORY_SEED } from "./seed-data";

/**
 * @deprecated Decommissioned in Milestone 3 (Member 6 scope).
 * Inventory records are persisted and queried via MongoDB Atlas at /api/inventory.
 */
export class InventoryRepository extends InMemoryRepository<InventoryItem> {
  constructor(seed = INVENTORY_SEED) {
    super(seed.map((props) => new InventoryItem(props)));
  }

  findLowStock(): InventoryItem[] {
    return this.items.filter((item) => item.isLow);
  }
}
