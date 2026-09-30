import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F9FA",
        card: "#FFFFFF",
        primary: "#1F6F8B",
        scope1: "#8ED1C6",
        scope2: "#F29E7D",
        ink: "#16323F",
        muted: "#5B7480",
      },
      fontFamily: {
        heading: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 8px 30px rgba(22, 50, 63, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
