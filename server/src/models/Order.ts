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
// The five stages an order moves through — mirrors the Kanban columns in the UI.
// "as const" tells TypeScript these are literal string values, not just any string.
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

    customer: {
      type: String,
      trim: true,
    },
    product: {
      type: String,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1, // an order must have at least 1 item
    },
    price: {
      type: Number,
      required: true,
      min: 0, // price can be 0 (free) but never negative
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Draft", // every new order starts as a Draft
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // auto-adds createdAt + updatedAt fields managed by Mongoose

    // Without this, virtuals are stripped when Mongoose converts the document
    // to JSON (e.g. when res.json() serialises it). "toObject" covers manual
    // .toObject() calls; "toJSON" covers res.json().
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: amount = qty × price.
// It is COMPUTED on read — never stored in MongoDB. This means:
//   - No double-storing (storing qty, price AND amount) that could go out of sync
//   - Always accurate; if price is updated, amount updates automatically
orderSchema.virtual("amount").get(function () {
  return this.qty * this.price;
});

// InferSchemaType lets TypeScript derive the document type directly from the
// schema definition — no need to duplicate the field list as a separate interface.
export type OrderAttrs = InferSchemaType<typeof orderSchema>;

// HydratedDocument adds Mongoose's instance methods (_id, save(), etc.) on top.
export type OrderDocument = HydratedDocument<OrderAttrs>;

// The model is the class you call .find(), .create(), .findById() etc. on.
// The string "Order" becomes the MongoDB collection name "orders" (auto-pluralised).
export const Order = model("Order", orderSchema);
