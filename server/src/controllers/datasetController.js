import { getReviewerDatasetSummary } from "../services/reviewerDatasetService.js";

export const getDatasetSummary = async (_req, res, next) => {
  try {
    const summary = await getReviewerDatasetSummary();

    return res.json({
      success: true,
      data: {
        totalRows: summary.totalRows,
        totalEmails: summary.totalEmails,
        totalOrders: summary.totalOrders,
      },
    });
  } catch (error) {
    return next(error);
  }
};
