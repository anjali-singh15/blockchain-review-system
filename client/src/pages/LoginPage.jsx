import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useAuth();
  const { pushNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      await login(formData);
      pushNotification({ type: "success", title: "Welcome back", message: "You are now logged in." });
      navigate("/submit");
    } catch (error) {
      const backendMessage = error.response?.data?.message || "Unable to log in right now.";
      setErrorMessage(backendMessage);
      pushNotification({
        type: "error",
        title: "Login failed",
        message: backendMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <PageHeader eyebrow="Authentication" title="Login to access your account" description="Any user can log in. Review submission is restricted to dataset-approved emails with a valid order ID." />
      <form onSubmit={handleSubmit} className="glass-panel mx-auto grid max-w-xl gap-5 rounded-[2rem] p-6 shadow-soft">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
          <input
            type="email"
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            required
            className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-slate-900 outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 pr-16 text-slate-900 outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-4 text-sm font-semibold text-slate-600 dark:text-slate-300"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <button type="submit" disabled={loading} className="rounded-full bg-teal-400 px-5 py-3 font-semibold text-black transition hover:bg-teal-300 disabled:opacity-60">
          {loading ? "Logging in..." : "Login"}
        </button>
        {errorMessage ? <p className="text-sm font-medium text-black dark:text-red-400">{errorMessage}</p> : null}
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-slate-900 underline dark:text-slate-100">
            Forgot Password?
          </Link>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          New here?{" "}
          <Link to="/register" className="font-semibold text-slate-900 underline dark:text-slate-100">
            Create an account
          </Link>
        </p>
      </form>
    </section>
  );
};

export default LoginPage;
