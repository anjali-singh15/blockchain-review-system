import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    reviewText: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    trustScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    label: {
      type: String,
      enum: ["FAKE", "GENUINE"],
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    reasons: {
      type: [String],
      default: [],
    },
    blockchainTxHash: {
      type: String,
      trim: true,
      default: "",
    },
    blockchainStoredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ productName: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ label: 1, verified: 1, createdAt: -1 });
reviewSchema.index({ orderId: 1, userId: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
