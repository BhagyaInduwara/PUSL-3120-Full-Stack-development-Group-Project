import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Invoice, INVOICE_STATUSES, toPublicInvoice } from "../models/Invoice.js";
import { generateRecordNumber } from "../utils/recordNumber.js";

function isValidStatus(value: unknown): value is (typeof INVOICE_STATUSES)[number] {
  return typeof value === "string" && (INVOICE_STATUSES as readonly string[]).includes(value);
}

/** GET /api/invoices — populates orderId so the response includes order details, not just its id. */
export async function listInvoices(_req: Request, res: Response): Promise<void> {
  const invoices = await Invoice.find().sort({ createdAt: 1 }).populate("orderId");
  res.json({ invoices: invoices.map(toPublicInvoice) });
}

/** GET /api/invoices/:id */
export async function getInvoice(req: Request, res: Response): Promise<void> {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found." });
    return;
  }
  res.json({ invoice: toPublicInvoice(invoice) });
}

/** POST /api/invoices */
export async function createInvoice(req: Request, res: Response): Promise<void> {
  const orderId = typeof req.body?.orderId === "string" ? req.body.orderId : "";
  if (!orderId || !Types.ObjectId.isValid(orderId)) {
    res.status(400).json({ error: "A valid orderId is required." });
    return;
  }
  if (req.body?.status !== undefined && !isValidStatus(req.body.status)) {
    res.status(400).json({ error: `Status must be one of: ${INVOICE_STATUSES.join(", ")}.` });
    return;
  }

  const number = await generateRecordNumber("invoice", new Date());
  const invoice = await Invoice.create({
    number,
    orderId,
    status: req.body?.status,
    issueDate: req.body?.issueDate,
    dueDate: req.body?.dueDate,
  });
  res.status(201).json({ invoice: toPublicInvoice(invoice) });
}

/** PUT /api/invoices/:id */
export async function updateInvoice(req: Request, res: Response): Promise<void> {
  const patch: Record<string, unknown> = {};

  if (req.body?.orderId !== undefined) {
    if (typeof req.body.orderId !== "string" || !Types.ObjectId.isValid(req.body.orderId)) {
      res.status(400).json({ error: "orderId must be a valid id." });
      return;
    }
    patch.orderId = req.body.orderId;
  }
  if (req.body?.status !== undefined) {
    if (!isValidStatus(req.body.status)) {
      res.status(400).json({ error: `Status must be one of: ${INVOICE_STATUSES.join(", ")}.` });
      return;
    }
    patch.status = req.body.status;
  }
  if (req.body?.issueDate !== undefined) patch.issueDate = req.body.issueDate;
  if (req.body?.dueDate !== undefined) patch.dueDate = req.body.dueDate;

  const invoice = await Invoice.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true });
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found." });
    return;
  }
  res.json({ invoice: toPublicInvoice(invoice) });
}

/** PATCH /api/invoices/:id/mark-paid — no body needed. */
export async function markInvoicePaid(req: Request, res: Response): Promise<void> {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, { $set: { status: "Paid" } }, { new: true });
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found." });
    return;
  }
  res.json({ invoice: toPublicInvoice(invoice) });
}
