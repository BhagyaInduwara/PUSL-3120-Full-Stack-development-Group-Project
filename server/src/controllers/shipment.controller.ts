import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Shipment, SHIPMENT_STATUSES, toPublicShipment } from "../models/Shipment.js";
import { generateRecordNumber } from "../utils/recordNumber.js";
import { emitEvent } from "../utils/socket.js";

// Emitted on every successful create/update/dispatch/deliver, so every
// connected client's Shipments screen can refetch instead of needing a
// manual refresh — see sales/page.tsx's "order:changed" listener for the
// same pattern (src/app/(app)/shipments/page.tsx's own useLiveEvent call).
export const SHIPMENT_CHANGED_EVENT = "shipment:changed";

function isValidStatus(value: unknown): value is (typeof SHIPMENT_STATUSES)[number] {
  return typeof value === "string" && (SHIPMENT_STATUSES as readonly string[]).includes(value);
}

function isValidObjectIdOrNull(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && Types.ObjectId.isValid(value));
}

/** GET /api/shipments — populates orderId so the response includes order details, not just its id. */
export async function listShipments(_req: Request, res: Response): Promise<void> {
  const shipments = await Shipment.find().sort({ createdAt: 1 }).populate("orderId").populate("invoiceId", "number");
  res.json({ shipments: shipments.map(toPublicShipment) });
}

/** GET /api/shipments/:id */
export async function getShipment(req: Request, res: Response): Promise<void> {
  const shipment = await Shipment.findById(req.params.id).populate("orderId").populate("invoiceId", "number");
  if (!shipment) {
    res.status(404).json({ error: "Shipment not found." });
    return;
  }
  res.json({ shipment: toPublicShipment(shipment) });
}

/** POST /api/shipments */
export async function createShipment(req: Request, res: Response): Promise<void> {
  const orderId = typeof req.body?.orderId === "string" ? req.body.orderId : "";
  if (!orderId || !Types.ObjectId.isValid(orderId)) {
    res.status(400).json({ error: "A valid orderId is required." });
    return;
  }
  if (req.body?.invoiceId !== undefined && !isValidObjectIdOrNull(req.body.invoiceId)) {
    res.status(400).json({ error: "invoiceId must be a valid id or null." });
    return;
  }
  if (req.body?.status !== undefined && !isValidStatus(req.body.status)) {
    res.status(400).json({ error: `Status must be one of: ${SHIPMENT_STATUSES.join(", ")}.` });
    return;
  }

  const number = await generateRecordNumber("shipment", new Date());
  let shipment = await Shipment.create({
    number,
    orderId,
    invoiceId: req.body?.invoiceId ?? null,
    status: req.body?.status,
    date: req.body?.date,
  });
  shipment = await shipment.populate("orderId");
  if (shipment.invoiceId) {
    shipment = await shipment.populate("invoiceId", "number");
  }
  
  const publicShipment = toPublicShipment(shipment);

  emitEvent("shipment:created", { shipment: publicShipment });
  emitEvent(SHIPMENT_CHANGED_EVENT, { shipment: publicShipment });

  res.status(201).json({ shipment: publicShipment });
}

/** PUT /api/shipments/:id */
export async function updateShipment(req: Request, res: Response): Promise<void> {
  const existing = await Shipment.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Shipment not found." });
    return;
  }
  // Mirrors src/domain/Shipment.ts's canEdit getter ("Delivered shipments
  // are finalized and cannot be modified") — that was previously only
  // enforced by hiding the Edit button in the UI, so a direct API call
  // could still silently rewrite a delivered shipment's date/status.
  if (existing.status === "Delivered") {
    res.status(409).json({ error: "This shipment has already been delivered and can no longer be modified." });
    return;
  }

  const patch: Record<string, unknown> = {};

  if (req.body?.orderId !== undefined) {
    if (typeof req.body.orderId !== "string" || !Types.ObjectId.isValid(req.body.orderId)) {
      res.status(400).json({ error: "orderId must be a valid id." });
      return;
    }
    patch.orderId = req.body.orderId;
  }
  if (req.body?.invoiceId !== undefined) {
    if (!isValidObjectIdOrNull(req.body.invoiceId)) {
      res.status(400).json({ error: "invoiceId must be a valid id or null." });
      return;
    }
    patch.invoiceId = req.body.invoiceId;
  }
  if (req.body?.status !== undefined) {
    if (!isValidStatus(req.body.status)) {
      res.status(400).json({ error: `Status must be one of: ${SHIPMENT_STATUSES.join(", ")}.` });
      return;
    }
    patch.status = req.body.status;
  }
  if (req.body?.date !== undefined) patch.date = req.body.date;

  // Optimistic concurrency check — same pattern as order.controller.ts's
  // updateOrder: fold the client's last-seen updatedAt into the update's
  // own filter (atomic, no separate read-then-write race window) so a
  // save against a stale copy is rejected instead of silently overwriting
  // whatever someone else saved in between. (The Delivered guard above
  // already read `existing` once, but that read is only used to check
  // status, not as the concurrency token — this filter is a second,
  // independent condition evaluated atomically by MongoDB itself.)
  const filter: Record<string, unknown> = { _id: req.params.id };
  if (req.body?.expectedUpdatedAt !== undefined) {
    const expected = new Date(req.body.expectedUpdatedAt as string);
    if (Number.isNaN(expected.getTime())) {
      res.status(400).json({ error: "expectedUpdatedAt must be a valid date." });
      return;
    }
    filter.updatedAt = expected;
  }

  const shipment = await Shipment.findOneAndUpdate(
    filter,
    { $set: patch },
    { new: true, runValidators: true }
  ).populate("orderId").populate("invoiceId", "number");

  if (!shipment) {
    if (req.body?.expectedUpdatedAt !== undefined && (await Shipment.exists({ _id: req.params.id }))) {
      res.status(409).json({ error: "This shipment was changed by someone else. Reload and try again." });
      return;
    }
    res.status(404).json({ error: "Shipment not found." });
    return;
  }

  const publicShipment = toPublicShipment(shipment);

  // Emit the granular status event only if the status was actually updated
  // in this patch, but the coarse "changed" event fires on any successful
  // update — a PUT that only changes e.g. the date still needs the
  // Shipments screen to refetch.
  if (patch.status) {
    emitEvent("shipment:status_changed", { shipment: publicShipment });
  }
  emitEvent(SHIPMENT_CHANGED_EVENT, { shipment: publicShipment });

  res.json({ shipment: publicShipment });
}

/** PATCH /api/shipments/:id/dispatch — no body needed. */
export async function dispatchShipment(req: Request, res: Response): Promise<void> {
  const shipment = await Shipment.findByIdAndUpdate(
    req.params.id,
    { $set: { status: "Dispatched" } },
    { new: true }
  ).populate("orderId").populate("invoiceId", "number");
  
  if (!shipment) {
    res.status(404).json({ error: "Shipment not found." });
    return;
  }

  const publicShipment = toPublicShipment(shipment);

  emitEvent("shipment:status_changed", { shipment: publicShipment });
  emitEvent(SHIPMENT_CHANGED_EVENT, { shipment: publicShipment });

  res.json({ shipment: publicShipment });
}

/** PATCH /api/shipments/:id/deliver — no body needed. */
export async function deliverShipment(req: Request, res: Response): Promise<void> {
  const shipment = await Shipment.findByIdAndUpdate(
    req.params.id,
    { $set: { status: "Delivered" } },
    { new: true }
  ).populate("orderId").populate("invoiceId", "number");
  
  if (!shipment) {
    res.status(404).json({ error: "Shipment not found." });
    return;
  }

  const publicShipment = toPublicShipment(shipment);

  emitEvent("shipment:status_changed", { shipment: publicShipment });
  emitEvent(SHIPMENT_CHANGED_EVENT, { shipment: publicShipment });

  res.json({ shipment: publicShipment });
}