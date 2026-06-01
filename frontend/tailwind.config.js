/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c3d66",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-ring": "pulse-ring 2s infinite",
      },
      keyframes: {
        "pulse-ring": {
          "0%": {
            boxShadow: "0 0 0 0 rgba(14, 165, 233, 0.7)",
          },
          "70%": {
            boxShadow: "0 0 0 10px rgba(14, 165, 233, 0)",
          },
          "100%": {
            boxShadow: "0 0 0 0 rgba(14, 165, 233, 0)",
          },
        },
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
