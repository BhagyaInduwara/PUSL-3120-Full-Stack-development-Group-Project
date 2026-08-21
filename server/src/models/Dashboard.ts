import mongoose, { Schema, Document } from "mongoose";

// 1. Activity Feed Entry Model
export interface IActivityFeedEntry extends Document {
  message: string;
  occurredAt: Date;
}

const activityFeedEntrySchema = new Schema<IActivityFeedEntry>({
  message: { type: String, required: true },
  occurredAt: { type: Date, default: Date.now },
});

export const ActivityFeedEntry = mongoose.model<IActivityFeedEntry>(
  "ActivityFeedEntry", 
  activityFeedEntrySchema
);

// 2. Revenue Series Point Model
export interface IRevenueSeriesPoint extends Document {
  week: string;
  revenue: number;
  orders: number;
  sortOrder: number;
}

const revenueSeriesPointSchema = new Schema<IRevenueSeriesPoint>({
  week: { type: String, required: true },
  revenue: { type: Number, required: true },
  orders: { type: Number, required: true },
  sortOrder: { type: Number, required: true },
});

export const RevenueSeriesPoint = mongoose.model<IRevenueSeriesPoint>(
  "RevenueSeriesPoint", 
  revenueSeriesPointSchema
);