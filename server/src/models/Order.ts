import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/**
 * Order — minimal placeholder model. No Order CRUD exists in this backend
 * yet (that's a separate task); this file exists only so Invoice/Shipment's
 * `ref: "Order"` + `.populate("orderId")` have a registered model to
 * resolve against — without it, populate() throws MissingSchemaError.
 * Field shape mirrors the Next.js frontend's Order domain class
 * (src/domain/Order.ts) for consistency. The collection name ("orders")
 * matches what a real Order model would use, so replacing this file with
 * the real one later doesn't orphan any test data.
 */
export const ORDER_STATUSES = ["Draft", "Confirmed", "Invoiced", "Shipped", "Closed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const orderSchema = new Schema(
  {
    customer: { type: String, required: true, trim: true },
    product: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: "Draft" },
    date: { type: Date },
  },
  { timestamps: true }
);

export type OrderAttrs = InferSchemaType<typeof orderSchema>;
export type OrderDocument = HydratedDocument<OrderAttrs>;

export function toPublicOrder(order: OrderDocument) {
  return {
    id: order._id.toString(),
    customer: order.customer,
    product: order.product,
    qty: order.qty,
    price: order.price,
    status: order.status,
    date: order.date,
    createdAt: order.createdAt as Date,
    updatedAt: order.updatedAt as Date,
  };
}

export const Order = model("Order", orderSchema);
