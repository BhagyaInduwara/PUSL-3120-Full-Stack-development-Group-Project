import type { Request, Response } from "express";
import { Order, ORDER_STATUSES, type OrderStatus } from "../models/Order.js";
import { generateRecordNumber } from "../utils/recordNumber.js";
import { emitEvent } from "../utils/socket.js";

// Emitted whenever an order is created or moves to a new status, so every
// connected client's Sales & Order Board can update in place instead of
// needing a manual refresh — see sales/page.tsx's useLiveEvent("order:changed", ...)
// on the frontend. Also emitted from orderDraft.controller.ts's approveDraft,
// since approving a draft creates a real order the same way.
export const ORDER_CHANGED_EVENT = "order:changed";

interface OrderLineItemBody {
  product: string;
  qty: number;
  price: number;
}

function isValidLineItems(value: unknown): value is OrderLineItemBody[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((li) => {
      const item = li as Record<string, unknown>;
      return (
        li &&
        typeof li === "object" &&
        typeof item.product === "string" &&
        typeof item.qty === "number" &&
        item.qty >= 1 &&
        typeof item.price === "number" &&
        item.price >= 0
      );
    })
  );
}

// ---------------------------------------------------------------------------
// GET /api/orders
// Returns every order in the database, newest first.
// ---------------------------------------------------------------------------
export async function listOrders(_req: Request, res: Response): Promise<void> {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
}

// ---------------------------------------------------------------------------
// GET /api/orders/:id
// Returns a single order. Sends 404 if the id doesn't exist in the DB.
// ---------------------------------------------------------------------------
export async function getOrder(req: Request, res: Response): Promise<void> {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  res.json(order);
}

// ---------------------------------------------------------------------------
// POST /api/orders
// Creates a new order from the JSON body the client sends.
// ---------------------------------------------------------------------------
export async function createOrder(req: Request, res: Response): Promise<void> {
  if (!isValidLineItems(req.body?.lineItems)) {
    res.status(400).json({ error: "lineItems must be a non-empty array of { product, qty >= 1, price >= 0 }." });
    return;
  }

  const number = await generateRecordNumber("order", new Date());
  const order = await Order.create({ ...req.body, number });

  emitEvent("order:created", order);

  emitEvent(ORDER_CHANGED_EVENT, { order });
  res.status(201).json(order);
}

// ---------------------------------------------------------------------------
// PUT /api/orders/:id
// Replaces editable fields with the values from req.body.
// ---------------------------------------------------------------------------
export async function updateOrder(req: Request, res: Response): Promise<void> {
  if (req.body?.lineItems !== undefined && !isValidLineItems(req.body.lineItems)) {
    res.status(400).json({ error: "lineItems must be a non-empty array of { product, qty >= 1, price >= 0 }." });
    return;
  }

  // number is assigned once at creation and never client-editable, and
  // expectedUpdatedAt is a concurrency token, not a field to save — strip
  // both even if a PUT body includes them, rather than trust the caller.
  const { number: _ignoredNumber, expectedUpdatedAt, ...editableFields } = req.body ?? {};

  // Optimistic concurrency check: if the client tells us which updatedAt
  // it last read (every edit dialog does — see OrderDetailDialog), fold
  // that into the update's own filter so the write only applies if
  // nobody else has saved a change since. This is atomic — done as one
  // findOneAndUpdate, not a separate read-then-write — so two requests
  // racing each other can't both pass a check and then both write; the
  // second one to reach MongoDB simply matches zero documents.
  const filter: Record<string, unknown> = { _id: req.params.id };
  if (expectedUpdatedAt !== undefined) {
    const expected = new Date(expectedUpdatedAt as string);
    if (Number.isNaN(expected.getTime())) {
      res.status(400).json({ error: "expectedUpdatedAt must be a valid date." });
      return;
    }
    filter.updatedAt = expected;
  }

  const order = await Order.findOneAndUpdate(
    filter,
    editableFields,
    {
      new: true,           // return the document AFTER the update
      runValidators: true, // re-run schema validators on the new values
    }
  );

  if (!order) {
    // filter matched nothing — either this id doesn't exist at all, or it
    // exists but its updatedAt has moved on since the client last read it
    // (someone else saved a change in between). Tell those two cases
    // apart so a real 404 doesn't get misreported as a conflict.
    if (expectedUpdatedAt !== undefined && (await Order.exists({ _id: req.params.id }))) {
      res.status(409).json({ error: "This order was changed by someone else. Reload and try again." });
      return;
    }
    res.status(404).json({ error: "Order not found." });
    return;
  }

  emitEvent("order:updated", order);

  res.json(order);
}

// ---------------------------------------------------------------------------
// DELETE /api/orders/:id
// Permanently removes an order from the database.
// ---------------------------------------------------------------------------
export async function deleteOrder(req: Request, res: Response): Promise<void> {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  emitEvent("order:deleted", { id: req.params.id });
  emitEvent(ORDER_CHANGED_EVENT, { id: req.params.id });

  res.json({ ok: true });
}

// ---------------------------------------------------------------------------
// PATCH /api/orders/:id/status
// Moves an order to a new status stage — called by the Kanban board on drag.
// Body: { status: "Confirmed" }
// ---------------------------------------------------------------------------
export async function patchOrderStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as { status: OrderStatus };

  if (!ORDER_STATUSES.includes(status)) {
    res.status(400).json({
      error: `Invalid status. Must be one of: ${ORDER_STATUSES.join(", ")}`,
    });
    return;
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  emitEvent("order:updated", order);

  emitEvent(ORDER_CHANGED_EVENT, { order });
  res.json(order);
}
