import { Review } from "../models/Review.js";
import { User } from "../models/userModel.js";
import { env } from "../config/env.js";
import { analyzeReview } from "../services/reviewAnalysisService.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { validateOrder } from "../services/orderValidationService.js";
import { hashReview } from "../utils/hashReview.js";
import { storeReviewHashOnChain, isBlockchainConfigured } from "../services/blockchainService.js";

const buildFilters = (query) => {
  const filters = {};

  if (query.search) {
    filters.$or = [
      { productName: { $regex: escapeRegex(query.search), $options: "i" } },
      { reviewText: { $regex: escapeRegex(query.search), $options: "i" } },
      { userId: { $regex: escapeRegex(query.search), $options: "i" } },
    ];
  }

  if (query.label) {
    filters.label = query.label.toUpperCase();
  }

  if (query.status) {
    filters.verified = query.status === "Verified";
  }

  if (query.userId) {
    filters.userId = query.userId;
  }

  return filters;
};

const serializeReview = (review) => ({
  ...review,
  id: review.id || review._id,
  isFake: review.label === "FAKE",
  reason: review.reasons?.[0] || "",
});

const clampTrustScore = (value) => Math.max(0, Math.min(100, value));

export const createReview = async (req, res, next) => {
  try {
    const { productName, reviewText, rating, orderId } = req.body;

    if (!productName || !reviewText || !rating || !orderId) {
      return res.status(400).json({ success: false, message: "Product, review text, rating, and order ID are required" });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const orderValidation = await validateOrder({
      email: req.user.email,
      orderId,
      productName,
    });

    if (!orderValidation.valid) {
      return res.status(400).json({
        success: false,
        message: "This email and order ID are not allowed to review this product",
      });
    }

    const existingReview = await Review.findOne({
      userId: req.user._id,
      orderId: orderValidation.normalizedOrderId,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "A review for this order has already been submitted",
      });
    }

    const { trustScore, label, reasons, verified, isFake, reason } = await analyzeReview({
      productName,
      reviewText,
      rating: Number(rating),
      userId: req.user._id.toString(),
    });

    const reviewHash = hashReview({
      productName,
      reviewText,
      rating: Number(rating),
      userId: req.user._id.toString(),
    });

    if (label !== "GENUINE") {
      return res.status(200).json({
        success: true,
        message: "Fake review detected. Please try again.",
        data: {
          productName: productName.trim(),
          reviewText: reviewText.trim(),
          rating: Number(rating),
          orderId: orderValidation.normalizedOrderId,
          trustScore,
          label,
          verified: false,
          isFake,
          reason,
          reasons,
          contractAddress: env.contractAddress || "",
          reviewHash,
          userTrustScore: req.user.trustScore ?? 75,
        },
      });
    }

    const review = await Review.create({
      productName,
      reviewText,
      rating,
      userId: req.user._id,
      orderId: orderValidation.normalizedOrderId,
      trustScore,
      label,
      verified,
      reasons,
    });

    // Auto-store review hash on blockchain if configured
    let blockchainReceipt = null;
    if (isBlockchainConfigured()) {
      try {
        blockchainReceipt = await storeReviewHashOnChain(reviewHash);
        review.blockchainTxHash = blockchainReceipt.transactionHash;
        review.blockchainStoredAt = blockchainReceipt.minedAt;
        await review.save();
      } catch (blockchainError) {
        // Non-fatal: review is saved, blockchain storage is best-effort
        console.error("Blockchain hash storage failed (non-fatal):", blockchainError.message);
      }
    }

    const nextUserTrustScore = clampTrustScore((req.user.trustScore ?? 75) + 10);
    await User.findByIdAndUpdate(req.user._id, { trustScore: nextUserTrustScore });

    return res.status(201).json({
      success: true,
      message: "Review verified and stored successfully",
      txHash: review.blockchainTxHash || "",
      data: serializeReview({
        id: review._id,
        productName: review.productName,
        reviewText: review.reviewText,
        rating: review.rating,
        orderId: review.orderId,
        trustScore: review.trustScore,
        label: review.label,
        verified: review.verified,
        isFake,
        reason,
        reasons: review.reasons,
        createdAt: review.createdAt,
        blockchainTxHash: review.blockchainTxHash,
        blockchainStoredAt: review.blockchainStoredAt,
        contractAddress: env.contractAddress || "",
        reviewHash,
        userTrustScore: nextUserTrustScore,
      }),
    });
  } catch (error) {
    return next(error);
  }
};

export const saveReviewBlockchainReceipt = async (req, res, next) => {
  try {
    const { txHash } = req.body;

    if (!txHash) {
      return res.status(400).json({ success: false, message: "Transaction hash is required" });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You cannot update this review" });
    }

    review.blockchainTxHash = txHash.trim();
    review.blockchainStoredAt = new Date();
    await review.save();

    return res.json({
      success: true,
      message: "Blockchain transaction recorded successfully",
      data: {
        id: review._id,
        txHash: review.blockchainTxHash,
        blockchainStoredAt: review.blockchainStoredAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getReviews = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;
    const filters = buildFilters(req.query);

    const [reviews, total, analytics] = await Promise.all([
      Review.find(filters)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filters),
      Review.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            averageTrustScore: { $avg: "$trustScore" },
            fakeCount: {
              $sum: { $cond: [{ $eq: ["$label", "FAKE"] }, 1, 0] },
            },
            genuineCount: {
              $sum: { $cond: [{ $eq: ["$label", "GENUINE"] }, 1, 0] },
            },
            verifiedCount: {
              $sum: { $cond: ["$verified", 1, 0] },
            },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: reviews.map(serializeReview),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      analytics: analytics[0] || {
        averageTrustScore: 0,
        fakeCount: 0,
        genuineCount: 0,
        verifiedCount: 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getPublicReviews = async (_req, res, next) => {
  try {
    const reviews = await Review.find({ label: "GENUINE", verified: true })
      .populate("userId", "name trustScore")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: reviews.map((review) => ({
        id: review._id,
        productName: review.productName,
        reviewText: review.reviewText,
        rating: review.rating,
        isFake: false,
        reason: "",
        verified: review.verified,
        createdAt: review.createdAt,
        userName: review.userId?.name || "Verified Buyer",
        userTrustScore: review.userId?.trustScore ?? 75,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate("userId", "name email").lean();

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    return res.json({ success: true, data: serializeReview(review) });
  } catch (error) {
    return next(error);
  }
};
