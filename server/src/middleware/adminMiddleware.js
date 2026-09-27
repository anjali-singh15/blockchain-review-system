/**
 * Role-based access control middleware.
 * Requires requireAuth to run first so req.user is populated.
 */
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  return next();
};
