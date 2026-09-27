import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock all external dependencies ─────────────────────────────────────────
vi.mock("../src/models/Review.js", () => ({
  Review: {
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock("../src/models/userModel.js", () => ({
  User: {
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("../src/config/env.js", () => ({
  env: { contractAddress: "" },
}));

vi.mock("../src/services/reviewAnalysisService.js", () => ({
  analyzeReview: vi.fn(),
}));

vi.mock("../src/services/orderValidationService.js", () => ({
  validateOrder: vi.fn(),
}));

vi.mock("../src/services/blockchainService.js", () => ({
  storeReviewHashOnChain: vi.fn(),
  isBlockchainConfigured: vi.fn().mockReturnValue(false),
}));

vi.mock("../src/utils/hashReview.js", () => ({
  hashReview: vi.fn().mockReturnValue("mockhash123"),
}));

import { createReview, getPublicReviews } from "../src/controllers/reviewController.js";
import { Review } from "../src/models/Review.js";
import { analyzeReview } from "../src/services/reviewAnalysisService.js";
import { validateOrder } from "../src/services/orderValidationService.js";
import { User } from "../src/models/userModel.js";

const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const next = vi.fn();

const mockUser = {
  _id: "user123",
  email: "buyer@test.com",
  trustScore: 75,
  role: "user",
};

describe("reviewController — createReview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 if required fields are missing", async () => {
    const req = { body: { productName: "Laptop" }, user: mockUser };
    const res = makeRes();
    await createReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("should return 400 if rating is out of range", async () => {
    const req = {
      body: { productName: "Laptop", reviewText: "great product", rating: 6, orderId: "ORD123" },
      user: mockUser,
    };
    const res = makeRes();
    await createReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Rating must be between 1 and 5" }),
    );
  });

  it("should return 400 if order validation fails", async () => {
    validateOrder.mockResolvedValue({ valid: false });
    const req = {
      body: { productName: "Laptop", reviewText: "great product performance", rating: 4, orderId: "INVALID" },
      user: mockUser,
    };
    const res = makeRes();
    await createReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 409 if review for order already exists", async () => {
    validateOrder.mockResolvedValue({ valid: true, normalizedOrderId: "ORD123" });
    Review.findOne.mockResolvedValue({ _id: "existingReview" });
    const req = {
      body: { productName: "Laptop", reviewText: "great product performance", rating: 4, orderId: "ORD123" },
      user: mockUser,
    };
    const res = makeRes();
    await createReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("should return 201 with review data on successful genuine review", async () => {
    validateOrder.mockResolvedValue({ valid: true, normalizedOrderId: "ORD123" });
    Review.findOne.mockResolvedValue(null);
    analyzeReview.mockResolvedValue({
      trustScore: 88,
      label: "GENUINE",
      reasons: [],
      verified: true,
      isFake: false,
      reason: "",
    });
    Review.create.mockResolvedValue({
      _id: "review789",
      productName: "Laptop",
      reviewText: "Battery life and performance are excellent",
      rating: 4,
      orderId: "ORD123",
      trustScore: 88,
      label: "GENUINE",
      verified: true,
      reasons: [],
      createdAt: new Date(),
      blockchainTxHash: "",
      blockchainStoredAt: null,
      save: vi.fn().mockResolvedValue(undefined),
    });
    User.findByIdAndUpdate.mockResolvedValue(undefined);

    const req = {
      body: {
        productName: "Laptop",
        reviewText: "Battery life and performance are excellent",
        rating: 4,
        orderId: "ORD123",
      },
      user: mockUser,
    };
    const res = makeRes();
    await createReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ label: "GENUINE", verified: true }),
      }),
    );
  });
});

describe("reviewController — getPublicReviews", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return only verified genuine reviews", async () => {
    const mockReviews = [
      {
        _id: "r1",
        productName: "Phone",
        reviewText: "Excellent camera quality",
        rating: 5,
        label: "GENUINE",
        verified: true,
        createdAt: new Date(),
        userId: { name: "Alice", trustScore: 80 },
      },
    ];
    Review.find.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockReviews),
        }),
      }),
    });

    const req = {};
    const res = makeRes();
    await getPublicReviews(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ verified: true, isFake: false }),
        ]),
      }),
    );
  });
});
