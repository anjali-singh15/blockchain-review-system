/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09111f",
        mist: "#eff6ff",
        accent: "#0f766e",
        glow: "#f59e0b",
        slateblue: "#1d4ed8",
      },
      boxShadow: {
        soft: "0 20px 45px -20px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
};
