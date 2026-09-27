import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import PageHeader from "../components/PageHeader";
import { useNotification } from "../context/NotificationContext";

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { pushNotification } = useNotification();
  const email = location.state?.email || "";
  const resetToken = location.state?.resetToken || "";

  if (!email || !resetToken) {
    return <Navigate to="/forgot-password" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await resetPassword({
        email,
        resetToken,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      pushNotification({
        type: "success",
        title: "Password updated",
        message: response.message || "Your password has been reset successfully.",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      pushNotification({
        type: "error",
        title: "Reset failed",
        message: error.response?.data?.message || "Unable to reset password right now.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <PageHeader
        eyebrow="Reset Password"
        title="Choose a new password"
        description="Set a new password for your account. Make sure it is at least 8 characters long."
      />
      <form onSubmit={handleSubmit} className="glass-panel mx-auto grid max-w-xl gap-5 rounded-[2rem] p-6 shadow-soft">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">New Password</span>
          <input
            type="password"
            value={formData.newPassword}
            onChange={(event) => setFormData((current) => ({ ...current, newPassword: event.target.value }))}
            required
            className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-slate-900 outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Confirm Password</span>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
            required
            className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-slate-900 outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-amber-300 px-5 py-3 font-semibold text-black transition hover:bg-amber-200 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Reset Password"}
        </button>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Back to{" "}
          <Link to="/login" className="font-semibold text-slate-900 underline dark:text-slate-100">
            login
          </Link>
        </p>
      </form>
    </section>
  );
};

export default ResetPasswordPage;
