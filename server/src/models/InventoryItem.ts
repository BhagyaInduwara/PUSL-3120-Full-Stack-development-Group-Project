import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryItem extends Document {
  sku: string;
  name: string;
  category?: string;
  qty: number;
  reorderPoint: number;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String },
    qty: { type: Number, required: true, min: 0 },
    reorderPoint: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IInventoryItem>("InventoryItem", inventoryItemSchema);