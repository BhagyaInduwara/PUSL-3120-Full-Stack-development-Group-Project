import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Shipment, SHIPMENT_STATUSES, toPublicShipment } from "../models/Shipment.js";
import { generateRecordNumber } from "../utils/recordNumber.js";

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
  const shipment = await Shipment.findById(req.params.id);
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
  const shipment = await Shipment.create({
    number,
    orderId,
    invoiceId: req.body?.invoiceId ?? null,
    status: req.body?.status,
    date: req.body?.date,
  });
  res.status(201).json({ shipment: toPublicShipment(shipment) });
}

/** PUT /api/shipments/:id */
export async function updateShipment(req: Request, res: Response): Promise<void> {
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

  const shipment = await Shipment.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true });
  if (!shipment) {
    res.status(404).json({ error: "Shipment not found." });
    return;
  }
  res.json({ shipment: toPublicShipment(shipment) });
}

/** PATCH /api/shipments/:id/dispatch — no body needed. */
export async function dispatchShipment(req: Request, res: Response): Promise<void> {
  const shipment = await Shipment.findByIdAndUpdate(req.params.id, { $set: { status: "Dispatched" } }, { new: true });
  if (!shipment) {
    res.status(404).json({ error: "Shipment not found." });
    return;
  }
  res.json({ shipment: toPublicShipment(shipment) });
}

/** PATCH /api/shipments/:id/deliver — no body needed. */
export async function deliverShipment(req: Request, res: Response): Promise<void> {
  const shipment = await Shipment.findByIdAndUpdate(req.params.id, { $set: { status: "Delivered" } }, { new: true });
  if (!shipment) {
    res.status(404).json({ error: "Shipment not found." });
    return;
  }
  res.json({ shipment: toPublicShipment(shipment) });
}
