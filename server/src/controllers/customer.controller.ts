import type { Request, Response } from "express";
import { Customer, toPublicCustomer } from "../models/Customer.js";

/** GET /api/customers */
export async function listCustomers(_req: Request, res: Response): Promise<void> {
  const customers = await Customer.find().sort({ createdAt: 1 });
  res.json({ customers: customers.map(toPublicCustomer) });
}

/** GET /api/customers/:id */
export async function getCustomer(req: Request, res: Response): Promise<void> {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404).json({ error: "Customer not found." });
    return;
  }
  res.json({ customer: toPublicCustomer(customer) });
}

/** POST /api/customers */
export async function createCustomer(req: Request, res: Response): Promise<void> {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "Name is required." });
    return;
  }

  const customer = await Customer.create({
    name,
    contact: req.body?.contact,
    email: req.body?.email,
    city: req.body?.city,
  });
  res.status(201).json({ customer: toPublicCustomer(customer) });
}

/** PUT /api/customers/:id */
export async function updateCustomer(req: Request, res: Response): Promise<void> {
  if (req.body?.name !== undefined && typeof req.body.name === "string" && !req.body.name.trim()) {
    res.status(400).json({ error: "Name cannot be empty." });
    return;
  }

  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        ...(req.body?.name !== undefined && { name: req.body.name.trim() }),
        ...(req.body?.contact !== undefined && { contact: req.body.contact }),
        ...(req.body?.email !== undefined && { email: req.body.email }),
        ...(req.body?.city !== undefined && { city: req.body.city }),
      },
    },
    { new: true, runValidators: true }
  );

  if (!customer) {
    res.status(404).json({ error: "Customer not found." });
    return;
  }
  res.json({ customer: toPublicCustomer(customer) });
}

/** DELETE /api/customers/:id */
export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) {
    res.status(404).json({ error: "Customer not found." });
    return;
  }
  res.status(204).send();
}
