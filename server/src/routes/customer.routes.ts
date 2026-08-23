import { Router } from "express";
import { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from "../controllers/customer.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const customerRouter = Router();

customerRouter.get("/", requireAuth, asyncHandler(listCustomers));
customerRouter.get("/:id", requireAuth, asyncHandler(getCustomer));
customerRouter.post("/", requireAuth, asyncHandler(createCustomer));
customerRouter.put("/:id", requireAuth, asyncHandler(updateCustomer));
customerRouter.delete("/:id", requireAuth, asyncHandler(deleteCustomer));
