import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const productSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export type ProductAttrs = InferSchemaType<typeof productSchema>;
export type ProductDocument = HydratedDocument<ProductAttrs>;

export function toPublicProduct(product: ProductDocument) {
  return {
    id: product._id.toString(),
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.price,
    createdAt: product.createdAt as Date,
    updatedAt: product.updatedAt as Date,
  };
}

export const Product = model("Product", productSchema);
