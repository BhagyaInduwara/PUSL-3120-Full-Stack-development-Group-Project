import type { Request, Response } from "express";
import { Order, ORDER_STATUSES, type OrderStatus } from "../models/Order.js";
import { generateRecordNumber } from "../utils/recordNumber.js";

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

  // number is assigned once at creation and never client-editable — strip it
  // even if a PUT body includes one, rather than trust the caller.
  const { number: _ignoredNumber, ...editableFields } = req.body ?? {};

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    editableFields,
    {
      new: true,           // return the document AFTER the update
      runValidators: true, // re-run schema validators on the new values
    }
  );

  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

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

  res.json(order);
}
