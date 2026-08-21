import mongoose, { Schema, Document } from "mongoose";

export interface IProductionJob extends Document {
  product: string;
  qty: number;
  due: Date;
  status: string;
  progress: number;
}

const productionJobSchema = new Schema<IProductionJob>(
  {
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