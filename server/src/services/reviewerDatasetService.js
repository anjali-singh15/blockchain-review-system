import { ReviewerDatasetEntry } from "../models/ReviewerDatasetEntry.js";

const normalizeEmail = (value = "") => value.trim().toLowerCase();
const normalizeOrderId = (value = "") => value.trim().toUpperCase();
const normalizeProductName = (value = "") => value.trim().toLowerCase();

const normalizeRow = (row) => {
  const email = normalizeEmail(row.email);
  const orderId = normalizeOrderId(row.orderId);
  const productName = row.productName ? normalizeProductName(row.productName) : "";

  if (!email || !orderId) {
    return null;
  }

  return { email, orderId, productName };
};

const dedupeRows = (rows) => {
  const seen = new Set();

  return rows.filter((row) => {
    const key = `${row.email}::${row.orderId}::${row.productName}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const loadReviewerDataset = async () => {
  const rows = await ReviewerDatasetEntry.find({}, { email: 1, orderId: 1, productName: 1, _id: 0 })
    .lean()
    .exec();

  return dedupeRows(rows.map(normalizeRow).filter(Boolean));
};

export const saveReviewerDataset = async (rows) => {
  const normalizedRows = dedupeRows(rows.map(normalizeRow).filter(Boolean));

  await ReviewerDatasetEntry.deleteMany({});

  if (normalizedRows.length) {
    await ReviewerDatasetEntry.insertMany(normalizedRows, { ordered: false });
  }

  return normalizedRows;
};

export const getReviewerDatasetSummary = async () => {
  const [totalRows, distinctEmails, distinctOrders] = await Promise.all([
    ReviewerDatasetEntry.countDocuments(),
    ReviewerDatasetEntry.distinct("email"),
    ReviewerDatasetEntry.distinct("orderId"),
  ]);

  return {
    rows: [],
    totalRows,
    totalEmails: distinctEmails.length,
    totalOrders: distinctOrders.length,
  };
};

export const isDatasetReviewer = async ({ email, orderId, productName }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedOrderId = normalizeOrderId(orderId);
  const normalizedProductName = normalizeProductName(productName);
  const match = await ReviewerDatasetEntry.findOne({
    email: normalizedEmail,
    orderId: normalizedOrderId,
    $or: [{ productName: "" }, { productName: normalizedProductName }],
  })
    .lean()
    .exec();

  return {
    valid: Boolean(match),
    normalizedOrderId,
  };
};
