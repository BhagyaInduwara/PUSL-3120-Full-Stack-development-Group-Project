import { Router } from "express";
import { listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from "../controllers/supplier.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const supplierRouter = Router();

supplierRouter.get("/", requireAuth, asyncHandler(listSuppliers));
supplierRouter.get("/:id", requireAuth, asyncHandler(getSupplier));
supplierRouter.post("/", requireAuth, asyncHandler(createSupplier));
supplierRouter.put("/:id", requireAuth, asyncHandler(updateSupplier));
supplierRouter.delete("/:id", requireAuth, asyncHandler(deleteSupplier));
