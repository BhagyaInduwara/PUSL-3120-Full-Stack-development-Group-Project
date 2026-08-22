import { Router } from "express";
import {
  getProductionJobs,
  getProductionJobById,
  createProductionJob,
  updateProductionJob,
  updateProductionJobStatus,
} from "../controllers/productionJob.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Protect all these routes so only logged-in users can access them
router.use(requireAuth);

// Routes for /api/production-jobs
router.route("/")
  .get(getProductionJobs)
  .post(createProductionJob);

// Routes for /api/production-jobs/:id
router.route("/:id")
  .get(getProductionJobById)
  .put(updateProductionJob);

// Route specifically for updating status and progress
router.route("/:id/status")
  .patch(updateProductionJobStatus);

export default router;