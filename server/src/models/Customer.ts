import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, trim: true },
    email: { type: String, trim: true },
    city: { type: String, trim: true },
  },
  { timestamps: true }
);

export type CustomerAttrs = InferSchemaType<typeof customerSchema>;
export type CustomerDocument = HydratedDocument<CustomerAttrs>;

export function toPublicCustomer(customer: CustomerDocument) {
  return {
    id: customer._id.toString(),
    name: customer.name,
    contact: customer.contact,
    email: customer.email,
    city: customer.city,
    createdAt: customer.createdAt as Date,
    updatedAt: customer.updatedAt as Date,
  };
}

export const Customer = model("Customer", customerSchema);
