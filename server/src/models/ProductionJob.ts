import mongoose, { Schema, Document } from "mongoose";

export interface IProductionJob extends Document {
  number: string;
  orderNumber?: string;
  customer?: string;
  product: string;
  qty: number;
  due: Date;
  status: string;
  progress: number;
}

const productionJobSchema = new Schema<IProductionJob>(
  {
    // Human-readable display id, e.g. "2026/08/23/A001" — see
    // ../utils/recordNumber.ts. Assigned once at creation, immutable after.
    number: { type: String, required: true, unique: true },

    orderNumber: { type: String, required: false },
    customer: { type: String, required: false },
    product: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    due: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ["Planned", "In Progress", "Completed"], 
      default: "Planned" 
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IProductionJob>("ProductionJob", productionJobSchema);