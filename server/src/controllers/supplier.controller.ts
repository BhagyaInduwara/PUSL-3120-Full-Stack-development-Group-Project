import type { Request, Response } from "express";
import { Supplier, toPublicSupplier } from "../models/Supplier.js";

/** GET /api/suppliers */
export async function listSuppliers(_req: Request, res: Response): Promise<void> {
  const suppliers = await Supplier.find().sort({ createdAt: 1 });
  res.json({ suppliers: suppliers.map(toPublicSupplier) });
}

/** GET /api/suppliers/:id */
export async function getSupplier(req: Request, res: Response): Promise<void> {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    res.status(404).json({ error: "Supplier not found." });
    return;
  }
  res.json({ supplier: toPublicSupplier(supplier) });
}

/** POST /api/suppliers */
export async function createSupplier(req: Request, res: Response): Promise<void> {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "Name is required." });
    return;
  }

  const supplier = await Supplier.create({
    name,
    category: req.body?.category,
    contact: req.body?.contact,
    leadTime: req.body?.leadTime,
  });
  res.status(201).json({ supplier: toPublicSupplier(supplier) });
}

/** PUT /api/suppliers/:id */
export async function updateSupplier(req: Request, res: Response): Promise<void> {
  if (req.body?.name !== undefined && typeof req.body.name === "string" && !req.body.name.trim()) {
    res.status(400).json({ error: "Name cannot be empty." });
    return;
  }

  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        ...(req.body?.name !== undefined && { name: req.body.name.trim() }),
        ...(req.body?.category !== undefined && { category: req.body.category }),
        ...(req.body?.contact !== undefined && { contact: req.body.contact }),
        ...(req.body?.leadTime !== undefined && { leadTime: req.body.leadTime }),
      },
    },
    { new: true, runValidators: true }
  );

  if (!supplier) {
    res.status(404).json({ error: "Supplier not found." });
    return;
  }
  res.json({ supplier: toPublicSupplier(supplier) });
}

/** DELETE /api/suppliers/:id */
export async function deleteSupplier(req: Request, res: Response): Promise<void> {
  const supplier = await Supplier.findByIdAndDelete(req.params.id);
  if (!supplier) {
    res.status(404).json({ error: "Supplier not found." });
    return;
  }
  res.status(204).send();
}
