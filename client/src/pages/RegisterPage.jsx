import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { register } = useAuth();
  const { pushNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      await register(formData);
      pushNotification({ type: "success", title: "Account created", message: "You can now submit verified reviews." });
      navigate("/submit");
    } catch (error) {
      const backendMessage = error.response?.data?.message || "Unable to register right now.";
      setErrorMessage(backendMessage);
      pushNotification({
        type: "error",
        title: "Registration failed",
        message: backendMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <PageHeader eyebrow="Authentication" title="Create your account" description="Anyone can register and log in. Only dataset-approved emails can submit product reviews." />
      <form onSubmit={handleSubmit} className="glass-panel mx-auto grid max-w-xl gap-5 rounded-[2rem] p-6 shadow-soft">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</span>
          <input
            value={formData.name}
            onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
            required
            className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-slate-900 outline-none focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
        </label>
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
        <button type="submit" disabled={loading} className="rounded-full bg-amber-300 px-5 py-3 font-semibold text-black transition hover:bg-amber-200 disabled:opacity-60">
          {loading ? "Creating account..." : "Register"}
        </button>
        {errorMessage ? <p className="text-sm font-medium text-black dark:text-red-400">{errorMessage}</p> : null}
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-slate-900 underline dark:text-slate-100">
            Login
          </Link>
        </p>
      </form>
    </section>
  );
};

export default RegisterPage;
