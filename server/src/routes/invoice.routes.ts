import { Router } from "express";
import { listInvoices, getInvoice, createInvoice, updateInvoice, markInvoicePaid } from "../controllers/invoice.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const invoiceRouter = Router();

invoiceRouter.get("/", requireAuth, asyncHandler(listInvoices));
invoiceRouter.get("/:id", requireAuth, asyncHandler(getInvoice));
invoiceRouter.post("/", requireAuth, asyncHandler(createInvoice));
invoiceRouter.put("/:id", requireAuth, asyncHandler(updateInvoice));
invoiceRouter.patch("/:id/mark-paid", requireAuth, asyncHandler(markInvoicePaid));
