import { Router } from "express";
import {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../controllers/inventory.controller.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

// Protect all these routes so only logged-in users can access them
router.use(requireAuth);

// Routes for /api/inventory
router.route("/")
  .get(getInventoryItems)
  .post(createInventoryItem);

// Routes for /api/inventory/:id
router.route("/:id")
  .get(getInventoryItemById)
  .put(updateInventoryItem)
  .delete(deleteInventoryItem);

export default router;