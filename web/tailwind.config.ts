import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--color-primary)",
          dark: "var(--color-primary-dark)",
          light: "var(--color-primary-light)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
        },
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        cream: "var(--cream)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "80rem",
      },
      boxShadow: {
        brand: "0 12px 40px -12px rgba(242, 140, 40, 0.35)",
        card: "0 4px 24px -8px rgba(15, 23, 42, 0.08)",
        "card-hover": "0 12px 40px -12px rgba(15, 23, 42, 0.12)",
      },
      transitionDuration: {
        250: "250ms",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
