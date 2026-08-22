import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listDrafts,
  getDraft,
  createDraft,
  updateDraft,
  deleteDraft,
  approveDraft,
} from "../controllers/orderDraft.controller.js";

export const orderDraftRouter = Router();

// NOTE: This router is mounted at "/api/order-drafts" in app.ts.

// Collection routes — operate on the whole drafts list
orderDraftRouter.get("/", requireAuth, asyncHandler(listDrafts));
orderDraftRouter.post("/", requireAuth, asyncHandler(createDraft));

// Single-resource routes — operate on one draft by its MongoDB _id
orderDraftRouter.get("/:id", requireAuth, asyncHandler(getDraft));
orderDraftRouter.put("/:id", requireAuth, asyncHandler(updateDraft));
orderDraftRouter.delete("/:id", requireAuth, asyncHandler(deleteDraft));

// Action route — POST because approving creates a new Order and destroys the draft.
// This is intentionally POST (not PATCH/PUT) — it triggers a state transition
// that produces a new resource, which is what POST semantics describe.
orderDraftRouter.post("/:id/approve", requireAuth, asyncHandler(approveDraft));
