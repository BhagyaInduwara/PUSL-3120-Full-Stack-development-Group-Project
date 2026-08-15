import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

// ---------------------------------------------------------------------------
// Sub-schema: one line item inside a draft.
//
// This is an EMBEDDED sub-document — it lives inside the draft document in
// MongoDB, not in its own collection. Line items have no independent existence:
// they can't be fetched, updated, or deleted without going through their parent
// draft. That's exactly why embedding is correct here.
//
// Mongoose automatically adds an _id to each sub-document, which is useful
// if the UI ever needs to identify a specific line item to edit or remove it.
// ---------------------------------------------------------------------------
const lineItemSchema = new Schema({
  product: {
    type: String,
    trim: true,
  },
  qty: {
    type: Number,
    min: 1,
  },
  price: {
    type: Number,
    min: 0,
  },
});

// ---------------------------------------------------------------------------
// Main schema: the incoming order draft.
//
// This represents an email that arrived from a customer describing what they
// want to order. A staff member reviews it and either discards it (DELETE) or
// approves it (POST /:id/approve), which converts it into a real Order.
// ---------------------------------------------------------------------------
const incomingOrderDraftSchema = new Schema(
  {
    customer: {
      type: String,
      trim: true,
    },
    emailSubject: {
      type: String,
      trim: true,
    },
    // An array of lineItemSchema sub-documents, embedded directly in this document.
    // "[]" notation tells Mongoose: "this field holds an array of these sub-docs".
    lineItems: [lineItemSchema],
  },
  { timestamps: true } // auto-adds createdAt + updatedAt
);

// TypeScript types derived from the schemas — no need to write them by hand.
export type LineItemAttrs = InferSchemaType<typeof lineItemSchema>;
export type IncomingOrderDraftAttrs = InferSchemaType<typeof incomingOrderDraftSchema>;
export type IncomingOrderDraftDocument = HydratedDocument<IncomingOrderDraftAttrs>;

// The string "IncomingOrderDraft" → MongoDB collection name "incomingorderdrafts" (auto-pluralised).
export const IncomingOrderDraft = model("IncomingOrderDraft", incomingOrderDraftSchema);
