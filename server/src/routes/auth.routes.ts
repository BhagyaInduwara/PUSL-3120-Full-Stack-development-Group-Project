import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = Router();

// Registration: creates new user resource (201 Created)
authRouter.post("/register", asyncHandler(register));

// Login: creates/authenticates session (200 OK + JWT cookie)
authRouter.post("/login", asyncHandler(login));

// Logout: destroys session (clears JWT cookie) - supports both POST and RESTful DELETE
authRouter.post("/logout", logout);
authRouter.delete("/logout", logout);

// Profile / Session info: retrieves authenticated user
authRouter.get("/me", requireAuth, asyncHandler(me));

