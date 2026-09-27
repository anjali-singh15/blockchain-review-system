import mongoose from "mongoose";

const reviewerDatasetEntrySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    productName: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  },
);

reviewerDatasetEntrySchema.index(
  { email: 1, orderId: 1, productName: 1 },
  { unique: true, name: "reviewer_dataset_unique_row" },
);
reviewerDatasetEntrySchema.index({ email: 1, orderId: 1 }, { name: "reviewer_dataset_lookup" });

export const ReviewerDatasetEntry = mongoose.model(
  "ReviewerDatasetEntry",
  reviewerDatasetEntrySchema,
);
