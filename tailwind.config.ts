import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { 50: "#fcf9f1", 100: "#f7f0e2", 200: "#efe4cd", 300: "#e6d6b6", 400: "#d8c196" },
        paper: "#fffdf7",
        ink: { DEFAULT: "#2c1d12", soft: "#4b3826", mute: "#7c6850", faint: "#a08c72" },
        cocoa: { DEFAULT: "#5b3a22", deep: "#3a2414", mid: "#7a4f2e", light: "#9a6b3f" },
        gold: { DEFAULT: "#b07d3c", soft: "#cb9d54", deep: "#8a5e26" },
        clay: "#9c5638",
        olive: { DEFAULT: "#6f7a45", soft: "#8a945d" },
        bronze: "#7d6a3a",
        line: { DEFAULT: "#e6d8bf", strong: "#d4c09c" },
        ok: "#5f6b3f",
        warn: "#a9772f",
        bad: "#9a4a35",
        info: "#5d6b73",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(58,36,20,.05), 0 10px 30px -16px rgba(58,36,20,.22)",
        lift: "0 2px 6px rgba(58,36,20,.08), 0 24px 50px -20px rgba(58,36,20,.32)",
        inset: "inset 0 1px 0 rgba(255,255,255,.6)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: { "fade-in": "fade-in .5s ease both" },
    },
  },
  plugins: [],
};

export default config;