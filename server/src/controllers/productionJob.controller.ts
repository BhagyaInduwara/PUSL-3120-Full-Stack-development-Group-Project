import { Request, Response } from "express";
import ProductionJob from "../models/ProductionJob.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateRecordNumber } from "../utils/recordNumber.js";
import { emitEvent } from "../utils/socket.js";

// Emitted on every successful create/update/status-change, so every
// connected client's Production board can refetch instead of needing a
// manual refresh — see src/app/(app)/production/page.tsx's useLiveEvent
// call, and shipment.controller.ts's SHIPMENT_CHANGED_EVENT for the same
// pattern applied to Shipments.
export const PRODUCTION_JOB_CHANGED_EVENT = "production_job:changed";

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

  emitEvent("production_job:created", { productionJob: newJob });
  emitEvent(PRODUCTION_JOB_CHANGED_EVENT, { productionJob: newJob });

  res.status(201).json({ productionJob: newJob });
});

// Update an entire production job
export const updateProductionJob = asyncHandler(async (req: Request, res: Response) => {
  const existing = await ProductionJob.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Production job not found" });
    return;
  }
  // Mirrors src/domain/ProductionJob.ts's canEdit getter ("only a Planned
  // job's scope can still change") — previously only enforced by hiding
  // the Edit button in the UI, so a direct API call could still silently
  // rewrite a Completed job's scope. Matches shipment.controller.ts's
  // Delivered guard for the same class of bug.
  if (existing.status === "Completed") {
    res.status(409).json({ error: "This production job has already been completed and can no longer be modified." });
    return;
  }

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
  
  emitEvent("production_job:updated", { productionJob: updatedJob });
  emitEvent(PRODUCTION_JOB_CHANGED_EVENT, { productionJob: updatedJob });

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

  emitEvent("production_job:updated", { productionJob: updatedJob });
  emitEvent(PRODUCTION_JOB_CHANGED_EVENT, { productionJob: updatedJob });

  res.status(200).json({ productionJob: updatedJob });
});