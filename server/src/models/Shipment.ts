import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from "mongoose";
import { toPublicOrder, type OrderDocument } from "./Order.js";

export const SHIPMENT_STATUSES = ["Draft", "Packed", "Dispatched", "Delivered"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

const shipmentSchema = new Schema(
  {
    // Human-readable display id, e.g. "2026/08/23/A001" — see
    // ../utils/recordNumber.ts. Assigned once at creation, immutable after.
    number: { type: String, required: true, unique: true },

    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },
    status: { type: String, enum: SHIPMENT_STATUSES, default: "Draft" },
    date: { type: Date },
  },
  { timestamps: true }
);

export type ShipmentAttrs = InferSchemaType<typeof shipmentSchema>;
export type ShipmentDocument = HydratedDocument<ShipmentAttrs>;

/** Handles both populated (list) and unpopulated (get/create/update) orderId/invoiceId via Document.populated(). */
export function toPublicShipment(shipment: ShipmentDocument) {
  const orderPopulated = shipment.populated("orderId");
  const orderVal = shipment.orderId as unknown;

  const invoicePopulated = shipment.invoiceId && shipment.populated("invoiceId");
  const invoiceVal = shipment.invoiceId as unknown as { _id: Types.ObjectId; number: string } | Types.ObjectId | null;

  return {
    id: shipment._id.toString(),
    number: shipment.number,
    orderId: orderPopulated ? (orderVal as OrderDocument)._id.toString() : (orderVal as Types.ObjectId).toString(),
    order: orderPopulated ? toPublicOrder(orderVal as OrderDocument) : undefined,
    invoiceId: shipment.invoiceId
      ? invoicePopulated
        ? (invoiceVal as { _id: Types.ObjectId })._id.toString()
        : (invoiceVal as Types.ObjectId).toString()
      : null,
    invoice: invoicePopulated ? { id: (invoiceVal as { _id: Types.ObjectId })._id.toString(), number: (invoiceVal as { number: string }).number } : undefined,
    status: shipment.status,
    date: shipment.date,
    createdAt: shipment.createdAt as Date,
    updatedAt: shipment.updatedAt as Date,
  };
}

export const Shipment = model("Shipment", shipmentSchema);
