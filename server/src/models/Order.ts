import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

// The five stages an order moves through — mirrors the Kanban columns in the UI.
// "as const" tells TypeScript these are literal string values, not just any string.
export const ORDER_STATUSES = ["Draft", "Confirmed", "Invoiced", "Shipped", "Closed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ---------------------------------------------------------------------------
// Sub-schema: one line item inside an order — same embedding rationale as
// IncomingOrderDraft's lineItemSchema (see that file): line items have no
// independent existence outside their parent Order. qty/price keep
// `required: true` here because that's what the old top-level Order fields
// had — an order line without a quantity or price was never valid.
// ---------------------------------------------------------------------------
const lineItemSchema = new Schema({
  product: {
    type: String,
    trim: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 1, // an order line must have at least 1 item
  },
  price: {
    type: Number,
    required: true,
    min: 0, // price can be 0 (free) but never negative
  },
});

const orderSchema = new Schema(
  {
    customer: { type: String, trim: true },

    // An array of lineItemSchema sub-documents, embedded directly in this
    // document — mirrors IncomingOrderDraft.lineItems. Unlike a draft, an
    // order can never be empty, hence the length validator.
    lineItems: {
      type: [lineItemSchema],
      validate: {
        validator: (items: unknown[]) => Array.isArray(items) && items.length > 0,
        message: "An order must have at least one line item.",
      },
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

// Virtual field: amount = sum(qty × price) across every line item.
// It is COMPUTED on read — never stored in MongoDB, so it can't drift out
// of sync with a line item edit.
orderSchema.virtual("amount").get(function () {
  return (this.lineItems ?? []).reduce((sum, li) => sum + li.qty * li.price, 0);
});

// InferSchemaType lets TypeScript derive the document type directly from the
// schema definition — no need to duplicate the field list as a separate interface.
export type OrderAttrs = InferSchemaType<typeof orderSchema>;

// HydratedDocument adds Mongoose's instance methods (_id, save(), etc.) on top.
export type OrderDocument = HydratedDocument<OrderAttrs>;

/**
 * Used by Invoice.ts/Shipment.ts's toPublicInvoice()/toPublicShipment() to
 * embed the linked order's details when it's been .populate()'d — see those
 * files. Includes the `amount` total explicitly since toPublicOrder builds
 * a plain object field-by-field rather than calling .toJSON()/.toObject()
 * (which is what actually applies the virtuals:true option above).
 */
export function toPublicOrder(order: OrderDocument) {
  const lineItems = (order.lineItems ?? []).map((li) => ({ product: li.product, qty: li.qty, price: li.price }));
  return {
    id: order._id.toString(),
    customer: order.customer,
    lineItems,
    amount: lineItems.reduce((sum, li) => sum + li.qty * li.price, 0),
    status: order.status,
    date: order.date,
    createdAt: order.createdAt as Date,
    updatedAt: order.updatedAt as Date,
  };
}

// The model is the class you call .find(), .create(), .findById() etc. on.
// The string "Order" becomes the MongoDB collection name "orders" (auto-pluralised).
// Used directly by order.controller.ts (full CRUD) and orderDraft.controller.ts
// (the draft-approval factory method), and referenced via `ref: "Order"` by
// Invoice.ts/Shipment.ts for population.
export const Order = model("Order", orderSchema);
