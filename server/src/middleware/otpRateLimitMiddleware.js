const stores = new Map();

const now = () => Date.now();

export const createOtpRateLimiter = ({
  keyPrefix,
  windowMs,
  maxRequests,
  getKey = (req) => req.ip,
  message,
}) => (req, res, next) => {
  const key = `${keyPrefix}:${getKey(req)}`;
  const entry = stores.get(key);
  const currentTime = now();

  if (!entry || currentTime > entry.expiresAt) {
    stores.set(key, { count: 1, expiresAt: currentTime + windowMs });
    return next();
  }

  if (entry.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      message,
    });
  }

  entry.count += 1;
  return next();
};
