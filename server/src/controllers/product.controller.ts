import type { Request, Response } from "express";
import { Product, toPublicProduct } from "../models/Product.js";

/** GET /api/products */
export async function listProducts(_req: Request, res: Response): Promise<void> {
  const products = await Product.find().sort({ createdAt: 1 });
  res.json({ products: products.map(toPublicProduct) });
}

/** GET /api/products/:id */
export async function getProduct(req: Request, res: Response): Promise<void> {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.json({ product: toPublicProduct(product) });
}

/** POST /api/products */
export async function createProduct(req: Request, res: Response): Promise<void> {
  const sku = typeof req.body?.sku === "string" ? req.body.sku.trim() : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const price = Number(req.body?.price);

  if (!sku) {
    res.status(400).json({ error: "SKU is required." });
    return;
  }
  if (!name) {
    res.status(400).json({ error: "Name is required." });
    return;
  }
  if (!Number.isFinite(price) || price < 0) {
    res.status(400).json({ error: "Price is required and must be a number >= 0." });
    return;
  }

  const existing = await Product.findOne({ sku: sku.toUpperCase() });
  if (existing) {
    res.status(409).json({ error: "That SKU is already in use." });
    return;
  }

  const product = await Product.create({ sku, name, category: req.body?.category, price });
  res.status(201).json({ product: toPublicProduct(product) });
}

/** PUT /api/products/:id */
export async function updateProduct(req: Request, res: Response): Promise<void> {
  const patch: Record<string, unknown> = {};

  if (req.body?.sku !== undefined) {
    const sku = typeof req.body.sku === "string" ? req.body.sku.trim() : "";
    if (!sku) {
      res.status(400).json({ error: "SKU cannot be empty." });
      return;
    }
    const existing = await Product.findOne({ sku: sku.toUpperCase(), _id: { $ne: req.params.id } });
    if (existing) {
      res.status(409).json({ error: "That SKU is already in use." });
      return;
    }
    patch.sku = sku;
  }

  if (req.body?.name !== undefined) {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      res.status(400).json({ error: "Name cannot be empty." });
      return;
    }
    patch.name = name;
  }

  if (req.body?.category !== undefined) patch.category = req.body.category;

  if (req.body?.price !== undefined) {
    const price = Number(req.body.price);
    if (!Number.isFinite(price) || price < 0) {
      res.status(400).json({ error: "Price must be a number >= 0." });
      return;
    }
    patch.price = price;
  }

  const product = await Product.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true });
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.json({ product: toPublicProduct(product) });
}

/** DELETE /api/products/:id */
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.status(204).send();
}
