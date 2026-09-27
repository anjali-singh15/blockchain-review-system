import { Router } from "express";
import { getDatasetSummary } from "../controllers/datasetController.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/dataset", requireAuth, requireAdmin, getDatasetSummary);

export default router;
