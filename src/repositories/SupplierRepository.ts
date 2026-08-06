import { InMemoryRepository } from "./Repository";
import { Supplier } from "@/domain/Supplier";
import { SUPPLIER_SEED } from "./seed-data";

export class SupplierRepository extends InMemoryRepository<Supplier> {
  constructor(seed = SUPPLIER_SEED) {
    super(seed.map((props) => new Supplier(props)));
  }
}
