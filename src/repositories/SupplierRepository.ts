import { InMemoryRepository } from "./Repository";
import { Supplier } from "@/domain/Supplier";
import { SUPPLIER_SEED } from "./seed-data";

/**
 * @deprecated Decommissioned in Milestone 3 (Member 6 scope).
 * Supplier records are persisted and queried via MongoDB Atlas at /api/suppliers.
 */
export class SupplierRepository extends InMemoryRepository<Supplier> {
  constructor(seed = SUPPLIER_SEED) {
    super(seed.map((props) => new Supplier(props)));
  }
}
