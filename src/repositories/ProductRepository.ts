import { InMemoryRepository } from "./Repository";
import { Product } from "@/domain/Product";
import { PRODUCT_SEED } from "./seed-data";

export class ProductRepository extends InMemoryRepository<Product> {
  constructor(seed = PRODUCT_SEED) {
    super(seed.map((props) => new Product(props)));
  }
}
