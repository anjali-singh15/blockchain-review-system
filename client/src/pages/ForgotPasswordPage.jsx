import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import PageHeader from "../components/PageHeader";
import { useNotification } from "../context/NotificationContext";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { pushNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await forgotPassword({ email });
      pushNotification({
        type: "success",
        title: "OTP sent",
        message: response.message || "Check your email for the OTP.",
      });
      navigate("/verify-otp", {
        state: {
          email: response.data?.email || email.trim().toLowerCase(),
        },
      });
    } catch (error) {
      pushNotification({
        type: "error",
        title: "Request failed",
        message: error.response?.data?.message || "Unable to send OTP right now.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <PageHeader
        eyebrow="Password Reset"
        title="Forgot your password?"
        description="Enter your registered email address and we will send a 6-digit OTP for password reset."
      />
      <form onSubmit={handleSubmit} className="glass-panel mx-auto grid max-w-xl gap-5 rounded-[2rem] p-6 shadow-soft">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Registered Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-slate-900 outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-teal-400 px-5 py-3 font-semibold text-black transition hover:bg-teal-300 disabled:opacity-60"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Remembered your password?{" "}
          <Link to="/login" className="font-semibold text-slate-900 underline dark:text-slate-100">
            Back to login
          </Link>
        </p>
      </form>
    </section>
  );
};

export default ForgotPasswordPage;
