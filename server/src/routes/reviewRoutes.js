import { Router } from "express";
import {
  createReview,
  getReviewById,
  getPublicReviews,
  getReviews,
  saveReviewBlockchainReceipt,
} from "../controllers/reviewController.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/reviews", requireAuth, createReview);
router.patch("/reviews/:id/blockchain", requireAuth, saveReviewBlockchainReceipt);
router.get("/reviews", requireAuth, requireAdmin, getReviews);
router.get("/reviews/public", getPublicReviews);
router.get("/reviews/:id", requireAuth, requireAdmin, getReviewById);

export default router;
