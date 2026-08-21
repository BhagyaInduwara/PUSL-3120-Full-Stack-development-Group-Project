import { Request, Response, NextFunction } from "express";
import { ActivityFeedEntry, RevenueSeriesPoint } from "../models/Dashboard.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// --- ACTIVITY FEED ---

// Get all activity feed entries (newest first)
export const getActivityFeed = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const activities = await ActivityFeedEntry.find().sort({ occurredAt: -1 });
  res.status(200).json({ activities });
});

// Create a new activity feed entry
export const createActivityEntry = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { message, occurredAt } = req.body;
  const newActivity = await ActivityFeedEntry.create({
    message,
    occurredAt: occurredAt || Date.now(),
  });
  res.status(201).json({ activity: newActivity });
});


// --- REVENUE SERIES ---

// Get all revenue series points (sorted by sortOrder)
export const getRevenueSeries = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const series = await RevenueSeriesPoint.find().sort({ sortOrder: 1 });
  res.status(200).json({ revenueSeries: series });
});

// Create or update a revenue series point
export const saveRevenueSeriesPoint = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { week, revenue, orders, sortOrder } = req.body;
  
  // This will update the point if the 'week' already exists, or create a new one if it doesn't
  const point = await RevenueSeriesPoint.findOneAndUpdate(
    { week },
    { week, revenue, orders, sortOrder },
    { new: true, upsert: true, runValidators: true }
  );
  
  res.status(201).json({ revenuePoint: point });
});