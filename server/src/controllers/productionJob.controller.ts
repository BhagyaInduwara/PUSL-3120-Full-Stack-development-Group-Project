import { Request, Response } from "express";
import ProductionJob from "../models/ProductionJob.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateRecordNumber } from "../utils/recordNumber.js";

// --- REAL-TIME EVENT HELPER ---
// Wraps socket emits in a try/catch so failures don't block the HTTP transaction
const safeEmit = (req: Request, event: string, data: any) => {
  try {
    const io = req.app.get("io");
    if (io) {
      io.emit(event, data);
    }
  } catch (error) {
    console.error(`[Socket Error] Failed to emit ${event}:`, error);
  }
};
// ------------------------------

// Get all production jobs
export const getProductionJobs = asyncHandler(async (req: Request, res: Response) => {
  const jobs = await ProductionJob.find();
  res.status(200).json({ productionJobs: jobs });
});

// Get a single production job by ID
export const getProductionJobById = asyncHandler(async (req: Request, res: Response) => {
  const job = await ProductionJob.findById(req.params.id);
  
  if (!job) {
    res.status(404).json({ error: "Production job not found" });
    return;
  }
  
  res.status(200).json({ productionJob: job });
});

// Create a new production job
export const createProductionJob = asyncHandler(async (req: Request, res: Response) => {
  const { product, qty, due, status, progress, orderNumber, customer } = req.body;

  const number = await generateRecordNumber("job", new Date());
  const newJob = await ProductionJob.create({
    number,
    orderNumber,
    customer,
    product,
    qty,
    due,
    status,
    progress
  });

  res.status(201).json({ productionJob: newJob });
});

// Update an entire production job
export const updateProductionJob = asyncHandler(async (req: Request, res: Response) => {
  const { product, qty, due, status, progress, orderNumber, customer } = req.body;
  
  const updatedJob = await ProductionJob.findByIdAndUpdate(
    req.params.id,
    { product, qty, due, status, progress, orderNumber, customer },
    { new: true, runValidators: true }
  );
  
  if (!updatedJob) {
    res.status(404).json({ error: "Production job not found" });
    return;
  }
  
  // Real-time event: Production Job Updated
  safeEmit(req, "production_job:updated", { productionJob: updatedJob });

  res.status(200).json({ productionJob: updatedJob });
});

// PATCH specifically for updating just status and progress
export const updateProductionJobStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, progress } = req.body;
  
  const updateFields: { status?: string; progress?: number } = {};
  if (status !== undefined) updateFields.status = status;
  if (progress !== undefined) updateFields.progress = progress;

  const updatedJob = await ProductionJob.findByIdAndUpdate(
    req.params.id,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!updatedJob) {
    res.status(404).json({ error: "Production job not found" });
    return;
  }

  // Real-time event: Production Job Updated (Stage/Progress progression)
  safeEmit(req, "production_job:updated", { productionJob: updatedJob });

  res.status(200).json({ productionJob: updatedJob });
});