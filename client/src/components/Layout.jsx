import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import NotificationStack from "./NotificationStack";

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/public-reviews", label: "Public Reviews" },
    { to: "/submit", label: "Submit Review" },
    ...(isAdmin ? [{ to: "/reviews", label: "All Reviews" }, { to: "/admin", label: "Admin" }] : []),
  ];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur dark:bg-slate-950/80">
        <div className="page-shell flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-400">ReviewTrust Chain</p>
            <h1 className="text-2xl font-semibold text-slate-50">Blockchain-Based Fake Product Review Detection</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-teal-400 text-black dark:bg-teal-500 dark:text-slate-950"
                        : "glass-panel text-black hover:border-teal-300/50 dark:text-slate-200 dark:hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((current) => !current)}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Profile
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-slate-200 bg-white p-4 text-black shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <p className="text-xs uppercase tracking-[0.25em] text-teal-500 dark:text-teal-300">Profile</p>
                    <div className="mt-3 grid gap-1">
                      <p className="text-sm font-semibold">{user?.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{user?.email}</p>
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Trust Score</p>
                      <p className="mt-1 text-2xl font-semibold">{user?.trustScore ?? 75}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-4 w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-rose-500 dark:text-white dark:hover:bg-rose-400"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex gap-2">
                <NavLink to="/login" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                  Login
                </NavLink>
                <NavLink to="/register" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-200 dark:bg-amber-400">
                  Register
                </NavLink>
              </div>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="glass-panel rounded-full px-4 py-2 text-sm font-semibold text-black transition hover:border-amber-300/60 dark:text-slate-200 dark:hover:text-white"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
      <NotificationStack />
    </div>
  );
};

export default Layout;
