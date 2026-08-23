import { Router } from "express";
import {
  listShipments,
  getShipment,
  createShipment,
  updateShipment,
  dispatchShipment,
  deliverShipment,
} from "../controllers/shipment.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const shipmentRouter = Router();

shipmentRouter.get("/", requireAuth, asyncHandler(listShipments));
shipmentRouter.get("/:id", requireAuth, asyncHandler(getShipment));
shipmentRouter.post("/", requireAuth, asyncHandler(createShipment));
shipmentRouter.put("/:id", requireAuth, asyncHandler(updateShipment));
shipmentRouter.patch("/:id/dispatch", requireAuth, asyncHandler(dispatchShipment));
shipmentRouter.patch("/:id/deliver", requireAuth, asyncHandler(deliverShipment));
