import { Router } from "express";
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const productRouter = Router();

productRouter.get("/", requireAuth, asyncHandler(listProducts));
productRouter.get("/:id", requireAuth, asyncHandler(getProduct));
productRouter.post("/", requireAuth, asyncHandler(createProduct));
productRouter.put("/:id", requireAuth, asyncHandler(updateProduct));
productRouter.delete("/:id", requireAuth, asyncHandler(deleteProduct));
