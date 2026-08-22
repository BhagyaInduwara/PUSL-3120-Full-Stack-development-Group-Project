import { Router } from "express";
import { listUsers, createUser } from "../controllers/user.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const userRouter = Router();

userRouter.get("/", requireAuth, asyncHandler(listUsers));
userRouter.post("/", requireAuth, requireAdmin, asyncHandler(createUser));
