import type { Request, Response } from "express";
import { IncomingOrderDraft } from "../models/IncomingOrderDraft.js";
import { Order } from "../models/Order.js";

// ---------------------------------------------------------------------------
// GET /api/order-drafts
// ---------------------------------------------------------------------------
export async function listDrafts(_req: Request, res: Response): Promise<void> {
  const drafts = await IncomingOrderDraft.find().sort({ createdAt: -1 });
  res.json(drafts);
}

// ---------------------------------------------------------------------------
// GET /api/order-drafts/:id
// ---------------------------------------------------------------------------
export async function getDraft(req: Request, res: Response): Promise<void> {
  const draft = await IncomingOrderDraft.findById(req.params.id);

  if (!draft) {
    res.status(404).json({ error: "Draft not found." });
    return;
  }

  res.json(draft);
}

// ---------------------------------------------------------------------------
// POST /api/order-drafts
// ---------------------------------------------------------------------------
export async function createDraft(req: Request, res: Response): Promise<void> {
  const draft = await IncomingOrderDraft.create(req.body);
  res.status(201).json(draft);
}

// ---------------------------------------------------------------------------
// PUT /api/order-drafts/:id
// ---------------------------------------------------------------------------
export async function updateDraft(req: Request, res: Response): Promise<void> {
  const draft = await IncomingOrderDraft.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!draft) {
    res.status(404).json({ error: "Draft not found." });
    return;
  }

  res.json(draft);
}

// ---------------------------------------------------------------------------
// DELETE /api/order-drafts/:id
// ---------------------------------------------------------------------------
export async function deleteDraft(req: Request, res: Response): Promise<void> {
  const draft = await IncomingOrderDraft.findByIdAndDelete(req.params.id);

  if (!draft) {
    res.status(404).json({ error: "Draft not found." });
    return;
  }

  res.json({ ok: true });
}

// ---------------------------------------------------------------------------
// POST /api/order-drafts/:id/approve
//
// FACTORY METHOD — converts an IncomingOrderDraft into a real Order.
//   1. Find the draft
//   2. Validate it has at least one line item
//   3. Create a new Order carrying over every line item (status: "Confirmed")
//   4. Delete the draft — it has been consumed
//   5. Return the newly created Order (201 Created)
// ---------------------------------------------------------------------------
export async function approveDraft(req: Request, res: Response): Promise<void> {
  const draft = await IncomingOrderDraft.findById(req.params.id);

  if (!draft) {
    res.status(404).json({ error: "Draft not found." });
    return;
  }

  if (!draft.lineItems || draft.lineItems.length === 0) {
    res.status(400).json({ error: "Draft has no line items to approve." });
    return;
  }

  // Create the Order — status "Confirmed" because a human has reviewed it
  const order = await Order.create({
    customer: draft.customer,
    lineItems: draft.lineItems.map((li) => ({ product: li.product, qty: li.qty, price: li.price })),
    status: "Confirmed",
    date: new Date(),
  });

  // Delete the draft AFTER the Order is successfully created
  await IncomingOrderDraft.findByIdAndDelete(req.params.id);

  res.status(201).json(order);
}
