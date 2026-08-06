import { Entity } from "./Entity";
import { Money } from "./Money";

export interface ProductProps {
  sku: string;
  name: string;
  category: string;
  price: number;
}

/** Product uses its SKU as identity — it's the natural key the rest of the ERP references it by. */
export class Product extends Entity {
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly price: Money;

  constructor(props: ProductProps) {
    super(props.sku);
    this.sku = props.sku;
    this.name = props.name;
    this.category = props.category;
    this.price = new Money(props.price);
  }

  get priceFormatted(): string {
    return this.price.format();
  }
}
