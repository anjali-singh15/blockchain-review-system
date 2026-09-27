import { createHash } from "crypto";

export const hashReview = ({ productName, reviewText, rating, userId }) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        productName: productName.trim(),
        reviewText: reviewText.trim(),
        rating,
        userId: userId.trim(),
      }),
    )
    .digest("hex");
