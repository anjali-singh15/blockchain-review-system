import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock heavy dependencies so tests run without DB / SMTP ─────────────────
vi.mock("../src/config/db.js", () => ({
  isDatabaseConnected: () => true,
}));

vi.mock("../src/services/emailService.js", () => ({
  sendPasswordResetOtpEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/models/userModel.js", () => {
  const mockUser = {
    _id: "user123",
    name: "Test User",
    email: "test@example.com",
    role: "user",
    trustScore: 75,
    comparePassword: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
  };

  return {
    User: {
      findOne: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
    },
    mockUser,
  };
});

vi.mock("../src/config/env.js", () => ({
  env: {
    jwtSecret: "test-secret-key-long-enough",
    otpExpiryMinutes: 5,
  },
}));

import { register, login } from "../src/controllers/authController.js";
import { User } from "../src/models/userModel.js";

const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const next = vi.fn();

describe("authController — register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 if required fields are missing", async () => {
    const req = { body: { email: "a@b.com" } };
    const res = makeRes();
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("should return 400 if password is too short", async () => {
    const req = { body: { name: "Alice", email: "alice@test.com", password: "short" } };
    const res = makeRes();
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Password must be at least 8 characters long" }),
    );
  });

  it("should return 400 if email already exists", async () => {
    User.findOne.mockResolvedValue({ email: "alice@test.com" });
    const req = { body: { name: "Alice", email: "alice@test.com", password: "password123" } };
    const res = makeRes();
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Email already exists" }));
  });

  it("should return 201 with token on successful registration", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: "user123",
      name: "Alice",
      email: "alice@test.com",
      role: "user",
      trustScore: 75,
    });

    const req = { body: { name: "Alice", email: "alice@test.com", password: "password123" } };
    const res = makeRes();
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ token: expect.any(String) }),
      }),
    );
  });
});

describe("authController — login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 if email or password is missing", async () => {
    const req = { body: { email: "a@b.com" } };
    const res = makeRes();
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 404 if user not found", async () => {
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    const req = { body: { email: "ghost@test.com", password: "password123" } };
    const res = makeRes();
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 401 if password is wrong", async () => {
    const mockUser = {
      _id: "user123",
      name: "Alice",
      email: "alice@test.com",
      role: "user",
      trustScore: 75,
      comparePassword: vi.fn().mockResolvedValue(false),
    };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(mockUser) });
    const req = { body: { email: "alice@test.com", password: "wrongpassword" } };
    const res = makeRes();
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 200 with token on successful login", async () => {
    const mockUser = {
      _id: "user123",
      name: "Alice",
      email: "alice@test.com",
      role: "user",
      trustScore: 75,
      comparePassword: vi.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(mockUser) });
    const req = { body: { email: "alice@test.com", password: "password123" } };
    const res = makeRes();
    await login(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ token: expect.any(String) }),
      }),
    );
  });
});
