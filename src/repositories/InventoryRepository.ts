import { InMemoryRepository } from "./Repository";
import { InventoryItem } from "@/domain/InventoryItem";
import { INVENTORY_SEED } from "./seed-data";

export class InventoryRepository extends InMemoryRepository<InventoryItem> {
  constructor(seed = INVENTORY_SEED) {
    super(seed.map((props) => new InventoryItem(props)));
  }

  findLowStock(): InventoryItem[] {
    return this.items.filter((item) => item.isLow);
  }
}
