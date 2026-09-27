import { describe, it, expect } from "vitest";
import { isFakeReview } from "../src/services/reviewAnalysisService.js";

describe("isFakeReview — rule-based fraud detection", () => {
  // ─── GENUINE REVIEWS ────────────────────────────────────────────────────────

  it("should return isFake=false for a clear genuine review", () => {
    const result = isFakeReview(
      "The battery life on this laptop is excellent. Performance is smooth and the display is crisp. Great value for the price.",
      "Laptop",
    );
    expect(result.isFake).toBe(false);
    expect(result.fakeScore).toBeLessThan(40);
  });

  it("should return isFake=false for a mid-length product-relevant review", () => {
    const result = isFakeReview(
      "Good quality fabric and comfortable fit. Delivery was fast and packaging was secure.",
      "T-Shirt",
    );
    expect(result.isFake).toBe(false);
  });

  // ─── GIBBERISH DETECTION ────────────────────────────────────────────────────

  it("should flag gibberish tokens as fake (score >= 40)", () => {
    const result = isFakeReview("xyzqwrst vbnmkljh product great delivery", "Headphones");
    expect(result.isFake).toBe(true);
    expect(result.reasons.some((r) => r.toLowerCase().includes("gibberish"))).toBe(true);
  });

  // ─── REPETITION DETECTION ───────────────────────────────────────────────────

  it("should flag massively repeated words as fake", () => {
    const result = isFakeReview("good good good good good product", "Charger");
    expect(result.isFake).toBe(true);
    expect(result.reasons.some((r) => r.toLowerCase().includes("repeat"))).toBe(true);
  });

  it("should add repeated character penalty reason even below threshold", () => {
    // "Greaaaaat" triggers repeated char rule (+20 score) but other signals keep it under 40
    const result = isFakeReview("Greaaaaat product amazing performance sound quality delivery", "Speaker");
    expect(result.reasons.some((r) => r.toLowerCase().includes("repeated character"))).toBe(true);
    expect(result.fakeScore).toBeGreaterThanOrEqual(20);
  });

  it("should flag combined gibberish + repeated characters as definitively fake", () => {
    // Multiple signals together push fakeScore >= 40
    const result = isFakeReview("xyzqwrst mmmmmm product great", "Speaker");
    expect(result.isFake).toBe(true);
  });

  // ─── MINIMAL CONTENT ────────────────────────────────────────────────────────

  it("should flag empty review as fake with fakeScore 100", () => {
    const result = isFakeReview("", "Phone");
    expect(result.isFake).toBe(true);
    expect(result.fakeScore).toBe(100);
  });

  it("should flag very short review with few meaningful words as fake", () => {
    const result = isFakeReview("ok good", "Watch");
    expect(result.isFake).toBe(true);
    expect(result.reasons.some((r) => r.toLowerCase().includes("meaningful"))).toBe(true);
  });

  // ─── PRODUCT RELEVANCE ──────────────────────────────────────────────────────

  it("should add irrelevance reason when review is off-topic", () => {
    // Off-topic review gets +25 relevance penalty but may stay under 40 alone
    const result = isFakeReview(
      "I went to the park and ate an apple under a tree yesterday afternoon",
      "Bluetooth Headphones",
    );
    expect(result.reasons.some((r) => r.toLowerCase().includes("relevant"))).toBe(true);
    expect(result.fakeScore).toBeGreaterThanOrEqual(25);
  });

  it("should flag irrelevant + short review as fake (combined penalties >= 40)", () => {
    const result = isFakeReview("park apple tree", "Bluetooth Headphones");
    expect(result.isFake).toBe(true);
  });

  it("should accept review mentioning product keywords as relevant", () => {
    const result = isFakeReview(
      "Sound quality is superb and battery lasts all day. Very comfortable design.",
      "Bluetooth Headphones",
    );
    expect(result.isFake).toBe(false);
  });

  // ─── FAKE SCORE BOUNDS ──────────────────────────────────────────────────────

  it("should clamp fakeScore between 70 and 100 when isFake is true", () => {
    const result = isFakeReview("xyzqwrst good good good product", "Laptop");
    if (result.isFake) {
      expect(result.fakeScore).toBeGreaterThanOrEqual(70);
      expect(result.fakeScore).toBeLessThanOrEqual(100);
    }
  });
});
