import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from "mongoose";
import { toPublicOrder, type OrderDocument } from "./Order.js";

export const INVOICE_STATUSES = ["Draft", "Sent", "Paid", "Overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

const invoiceSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    status: { type: String, enum: INVOICE_STATUSES, default: "Draft" },
    issueDate: { type: Date },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export type InvoiceAttrs = InferSchemaType<typeof invoiceSchema>;
export type InvoiceDocument = HydratedDocument<InvoiceAttrs>;

/** Handles both populated (list) and unpopulated (get/create/update) orderId via Document.populated(). */
export function toPublicInvoice(invoice: InvoiceDocument) {
  const orderPopulated = invoice.populated("orderId");
  const orderVal = invoice.orderId as unknown;

  return {
    id: invoice._id.toString(),
    orderId: orderPopulated ? (orderVal as OrderDocument)._id.toString() : (orderVal as Types.ObjectId).toString(),
    order: orderPopulated ? toPublicOrder(orderVal as OrderDocument) : undefined,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    createdAt: invoice.createdAt as Date,
    updatedAt: invoice.updatedAt as Date,
  };
}

export const Invoice = model("Invoice", invoiceSchema);
