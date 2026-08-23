import { Request, Response } from "express";
import InventoryItem from "../models/InventoryItem.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all inventory items
export const getInventoryItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await InventoryItem.find();
  res.status(200).json({ inventory: items });
});

// Get a single inventory item by ID
export const getInventoryItemById = asyncHandler(async (req: Request, res: Response) => {
  const item = await InventoryItem.findById(req.params.id);
  
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  
  res.status(200).json({ inventoryItem: item });
});

// Create a new inventory item
export const createInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const { sku, name, category, qty, reorderPoint } = req.body;
  
  const newItem = await InventoryItem.create({ 
    sku, 
    name, 
    category, 
    qty, 
    reorderPoint 
  });
  
  res.status(201).json({ inventoryItem: newItem });
});

// Update an existing inventory item
export const updateInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const { sku, name, category, qty, reorderPoint } = req.body;
  
  const updatedItem = await InventoryItem.findByIdAndUpdate(
    req.params.id,
    { sku, name, category, qty, reorderPoint },
    { new: true, runValidators: true }
  );
  
  if (!updatedItem) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  
  res.status(200).json({ inventoryItem: updatedItem });
});

// Delete an inventory item
export const deleteInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
  
  if (!deletedItem) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  
  res.status(200).json({ message: "Inventory item deleted successfully" });
});