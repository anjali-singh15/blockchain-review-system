import { isDatasetReviewer } from "./reviewerDatasetService.js";

export const validateOrder = async ({ email, orderId, productName }) => {
  const datasetValidation = await isDatasetReviewer({ email, orderId, productName });

  return {
    valid: datasetValidation.valid,
    normalizedOrderId: datasetValidation.normalizedOrderId,
  };
};
