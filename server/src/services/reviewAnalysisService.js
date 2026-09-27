import { Review } from "../models/Review.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const MIN_MEANINGFUL_WORDS = 5;
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "but",
  "by",
  "for",
  "from",
  "had",
  "has",
  "have",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "so",
  "than",
  "that",
  "the",
  "their",
  "them",
  "these",
  "they",
  "this",
  "to",
  "very",
  "was",
  "we",
  "were",
  "with",
  "you",
  "your",
]);
const PRODUCT_CONTEXT_WORDS = new Set([
  "audio",
  "battery",
  "build",
  "camera",
  "color",
  "comfort",
  "delivery",
  "design",
  "display",
  "durability",
  "durable",
  "fabric",
  "feature",
  "features",
  "fit",
  "flavor",
  "material",
  "package",
  "packaging",
  "performance",
  "price",
  "quality",
  "screen",
  "service",
  "shipping",
  "size",
  "smell",
  "sound",
  "speed",
  "taste",
  "texture",
  "value",
  "weight",
]);

const normalizeText = (value = "") => value.trim().replace(/\s+/g, " ").toLowerCase();
const tokenize = (value = "") => normalizeText(value).match(/[a-z0-9']+/g) || [];
const getMeaningfulWords = (tokens) =>
  tokens.filter((token) => token.length > 2 && !STOP_WORDS.has(token));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const average = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const getProductKeywords = (productName = "") =>
  tokenize(productName).filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const hasRepeatedCharacters = (text) => /([a-z])\1{3,}/i.test(text);

const hasGibberishToken = (tokens) =>
  tokens.some((token) => {
    if (token.length < 7) {
      return false;
    }

    const vowelCount = (token.match(/[aeiou]/gi) || []).length;
    const consonantCluster = /[^aeiou]{5,}/i.test(token);
    const uniqueCharacters = new Set(token).size;

    return consonantCluster || vowelCount / token.length < 0.2 || uniqueCharacters <= 3;
  });

const detectRepetition = (tokens) => {
  if (!tokens.length) {
    return false;
  }

  const counts = new Map();
  let highestCount = 0;

  for (const token of tokens) {
    const nextCount = (counts.get(token) || 0) + 1;
    counts.set(token, nextCount);
    highestCount = Math.max(highestCount, nextCount);
  }

  const repeatedSequence = /(\b[a-z0-9']+\b)(?:\s+\1){2,}/i.test(tokens.join(" "));
  return repeatedSequence || (highestCount >= 3 && highestCount / tokens.length >= 0.5);
};

const isRelevantToProduct = (meaningfulWords, productName) => {
  const productKeywords = getProductKeywords(productName);
  const reviewTerms = new Set(meaningfulWords);
  const keywordOverlap = productKeywords.some((keyword) => reviewTerms.has(keyword));
  const contextOverlapCount = meaningfulWords.filter((word) => PRODUCT_CONTEXT_WORDS.has(word)).length;

  return keywordOverlap || contextOverlapCount >= 2;
};

const buildRuleBasedFakeResult = (fakeScore, reasons) => ({
  isFake: true,
  fakeScore: clamp(fakeScore, 70, 100),
  reasons,
  reason: reasons[0] || "Review failed rule-based validation.",
});

export const isFakeReview = (text, productName = "") => {
  const normalizedText = normalizeText(text);
  const tokens = tokenize(text);
  const meaningfulWords = getMeaningfulWords(tokens);
  let fakeScore = 0;
  const reasons = [];

  if (!normalizedText) {
    return buildRuleBasedFakeResult(100, ["Review text is empty."]);
  }

  if (hasGibberishToken(tokens)) {
    fakeScore += 35;
    reasons.push("Review contains gibberish or random-looking text.");
  }

  if (detectRepetition(tokens)) {
    fakeScore += 25;
    reasons.push("Review repeats the same word or phrase too many times.");
  }

  if (meaningfulWords.length < MIN_MEANINGFUL_WORDS) {
    fakeScore += 20;
    reasons.push(`Review must contain at least ${MIN_MEANINGFUL_WORDS} meaningful words.`);
  }

  if (hasRepeatedCharacters(normalizedText)) {
    fakeScore += 20;
    reasons.push("Review contains unnatural repeated character patterns.");
  }

  if (!isRelevantToProduct(meaningfulWords, productName)) {
    fakeScore += 25;
    reasons.push("Review does not appear relevant to the product.");
  }

  if (fakeScore >= 40) {
    return buildRuleBasedFakeResult(fakeScore, reasons);
  }

  return {
    isFake: false,
    fakeScore,
    reasons,
    reason: reasons[0] || "",
  };
};

const scoreReviewQuality = ({ reviewText, rating, productName }) => {
  const tokens = tokenize(reviewText);
  const meaningfulWords = getMeaningfulWords(tokens);
  const wordCount = meaningfulWords.length;
  const relevanceBoost = isRelevantToProduct(meaningfulWords, productName) ? 12 : -18;
  const lengthBoost = clamp((wordCount - MIN_MEANINGFUL_WORDS) * 1.8, 0, 20);
  const ratingBoost = clamp((Number(rating) - 3) * 3, -6, 6);
  const repeatedCharacterPenalty = hasRepeatedCharacters(reviewText) ? -14 : 0;
  const repetitionPenalty = detectRepetition(tokens) ? -20 : 0;

  return clamp(55 + lengthBoost + relevanceBoost + ratingBoost + repeatedCharacterPenalty + repetitionPenalty, 20, 95);
};

const scoreUserHistory = ({ genuineReviewCount, fakeReviewCount, averageGenuineTrustScore }) => {
  const genuineBoost = clamp(genuineReviewCount * 4, 0, 20);
  const fakePenalty = clamp(fakeReviewCount * 7, 0, 28);
  const qualityAdjustment = clamp((averageGenuineTrustScore - 75) * 0.3, -8, 8);

  return clamp(55 + genuineBoost + qualityAdjustment - fakePenalty, 10, 95);
};

const mapFakeTrustScore = (fakeScore, penalties) => {
  const severityPenalty = clamp(Math.round(penalties / 2), 0, 20);
  return clamp(30 - Math.round(fakeScore / 4) - severityPenalty, 0, 30);
};

const mapSuspiciousTrustScore = (compositeScore) => clamp(Math.round(40 + ((compositeScore - 45) / 20) * 30), 40, 70);
const mapGenuineTrustScore = (compositeScore) => clamp(Math.round(80 + ((compositeScore - 65) / 35) * 20), 80, 100);

export const calculateTrustScore = async ({ productName, reviewText, rating, userId }) => {
  const ruleBasedResult = isFakeReview(reviewText, productName);
  const normalizedReviewText = normalizeText(reviewText);
  const now = new Date();

  const [duplicateReview, userHistory, similarReviews] = await Promise.all([
    Review.findOne({
      productName: new RegExp(`^${escapeRegex(productName.trim())}$`, "i"),
      reviewText: new RegExp(`^${escapeRegex(reviewText.trim())}$`, "i"),
    }).lean(),
    Review.find({ userId }).select("label trustScore createdAt").lean(),
    normalizedReviewText
      ? Review.find({
          reviewText: new RegExp(
            normalizedReviewText
              .split(" ")
              .slice(0, 8)
              .map((chunk) => escapeRegex(chunk))
              .join(".*"),
            "i",
          ),
        })
          .limit(5)
          .lean()
      : [],
  ]);

  const genuineReviews = userHistory.filter((review) => review.label === "GENUINE");
  const fakeReviews = userHistory.filter((review) => review.label === "FAKE");
  const recentReviewCount = userHistory.filter(
    (review) => new Date(review.createdAt).getTime() >= now.getTime() - 60 * 60 * 1000,
  ).length;

  const historySnapshot = {
    genuineReviewCount: genuineReviews.length,
    fakeReviewCount: fakeReviews.length,
    averageGenuineTrustScore: average(genuineReviews.map((review) => review.trustScore)),
  };

  const qualityScore = scoreReviewQuality({ reviewText, rating, productName });
  const userHistoryScore = scoreUserHistory(historySnapshot);
  let heuristicPenalty = 0;
  const reasons = [...ruleBasedResult.reasons];

  if (duplicateReview) {
    heuristicPenalty += 22;
    reasons.push("Duplicate review text detected for the same product.");
  }

  if (recentReviewCount >= 2) {
    heuristicPenalty += 12;
    reasons.push("High-frequency review activity detected in the last hour.");
  }

  if (similarReviews.length >= 2) {
    heuristicPenalty += 8;
    reasons.push("Similar review patterns found in recent submissions.");
  }

  if (fakeReviews.length >= 2) {
    heuristicPenalty += 14;
    reasons.push("User history includes multiple previously flagged fake reviews.");
  }

  const compositeScore = clamp(
    Math.round(qualityScore * 0.65 + userHistoryScore * 0.35 - heuristicPenalty),
    0,
    100,
  );

  const isFake = ruleBasedResult.isFake || compositeScore < 45;
  let trustScore;

  if (isFake) {
    trustScore = mapFakeTrustScore(Math.max(ruleBasedResult.fakeScore, 45 - compositeScore), heuristicPenalty);
  } else if (compositeScore < 65) {
    trustScore = mapSuspiciousTrustScore(compositeScore);
  } else {
    trustScore = mapGenuineTrustScore(compositeScore);
  }

  return {
    trustScore,
    label: isFake ? "FAKE" : "GENUINE",
    verified: !isFake,
    reasons,
    isFake,
    reason: reasons[0] || "",
    fakeScore: isFake ? clamp(100 - trustScore, 70, 100) : clamp(70 - trustScore, 0, 69),
    qualityScore,
    userHistoryScore,
    heuristicPenalty,
    compositeScore,
  };
};

export const analyzeReview = async ({ productName, reviewText, rating, userId }) =>
  calculateTrustScore({
    productName,
    reviewText,
    rating,
    userId,
  });
