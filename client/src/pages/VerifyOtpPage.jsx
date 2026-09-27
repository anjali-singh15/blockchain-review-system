import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { verifyOtp } from "../api/authApi";
import PageHeader from "../components/PageHeader";
import { useNotification } from "../context/NotificationContext";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { pushNotification } = useNotification();
  const email = location.state?.email || "";

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await verifyOtp({ email, otp });
      pushNotification({
        type: "success",
        title: "OTP verified",
        message: response.message || "You can now reset your password.",
      });
      navigate("/reset-password", {
        state: {
          email,
          resetToken: response.data?.resetToken,
        },
      });
    } catch (error) {
      pushNotification({
        type: "error",
        title: "Verification failed",
        message: error.response?.data?.message || "Unable to verify OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <PageHeader
        eyebrow="OTP Verification"
        title="Enter the 6-digit OTP"
        description={`We sent an OTP to ${email}. It will expire shortly, so enter it here to continue.`}
      />
      <form onSubmit={handleSubmit} className="glass-panel mx-auto grid max-w-xl gap-5 rounded-[2rem] p-6 shadow-soft">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">OTP</span>
          <input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-center text-2xl tracking-[0.35em] text-slate-900 outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-blue-300 px-5 py-3 font-semibold text-black transition hover:bg-blue-200 disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Need a new OTP?{" "}
          <Link to="/forgot-password" className="font-semibold text-slate-900 underline dark:text-slate-100">
            Request again
          </Link>
        </p>
      </form>
    </section>
  );
};

export default VerifyOtpPage;
