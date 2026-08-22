import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  patchOrderStatus,
} from "../controllers/order.controller.js";

export const orderRouter = Router();

// NOTE: This router is mounted at "/api/orders" in app.ts.
// So "/" here means GET /api/orders, and "/:id" means GET /api/orders/:id, etc.

// Collection routes — operate on the whole orders list
orderRouter.get("/", requireAuth, asyncHandler(listOrders));
orderRouter.post("/", requireAuth, asyncHandler(createOrder));

// Single-resource routes — operate on one order by its MongoDB _id
orderRouter.get("/:id", requireAuth, asyncHandler(getOrder));
orderRouter.put("/:id", requireAuth, asyncHandler(updateOrder));
orderRouter.delete("/:id", requireAuth, asyncHandler(deleteOrder));

// Sub-resource action — updates only the status field (Kanban card drag)
// Must be defined BEFORE "/:id" routes if there were any ambiguity, but
// Express matches routes in order, and "/status" won't be confused for an _id
// because it comes after the fixed string ":id/status".
orderRouter.patch("/:id/status", requireAuth, asyncHandler(patchOrderStatus));
