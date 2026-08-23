import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const supplierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    contact: { type: String, trim: true },
    leadTime: { type: String, trim: true },
  },
  { timestamps: true }
);

export type SupplierAttrs = InferSchemaType<typeof supplierSchema>;
export type SupplierDocument = HydratedDocument<SupplierAttrs>;

export function toPublicSupplier(supplier: SupplierDocument) {
  return {
    id: supplier._id.toString(),
    name: supplier.name,
    category: supplier.category,
    contact: supplier.contact,
    leadTime: supplier.leadTime,
    createdAt: supplier.createdAt as Date,
    updatedAt: supplier.updatedAt as Date,
  };
}

export const Supplier = model("Supplier", supplierSchema);
