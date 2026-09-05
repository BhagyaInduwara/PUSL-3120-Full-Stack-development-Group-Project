import { InMemoryRepository } from "./Repository";
import { Product } from "@/domain/Product";
import { PRODUCT_SEED } from "./seed-data";

/**
 * @deprecated Decommissioned in Milestone 3 (Member 6 scope).
 * Product catalog is persisted and queried via MongoDB Atlas at /api/products.
 */
export class ProductRepository extends InMemoryRepository<Product> {
  constructor(seed = PRODUCT_SEED) {
    super(seed.map((props) => new Product(props)));
  }
}
