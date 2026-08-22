import { Router } from "express";
import {
  getActivityFeed,
  createActivityEntry,
  getRevenueSeries,
  saveRevenueSeriesPoint,
} from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const activityRouter = Router();
export const revenueSeriesRouter = Router();

// Protect all dashboard routes so only logged-in users can access them
activityRouter.use(requireAuth);
revenueSeriesRouter.use(requireAuth);

// Routes for /api/activity
activityRouter.route("/")
  .get(getActivityFeed)
  .post(createActivityEntry);

// Routes for /api/revenue-series
revenueSeriesRouter.route("/")
  .get(getRevenueSeries)
  .post(saveRevenueSeriesPoint);