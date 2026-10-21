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
        // CSS-variable colors need color-mix so opacity modifiers (bg-primary/10) work.
        background: "color-mix(in srgb, var(--background) calc(<alpha-value> * 100%), transparent)",
        foreground: "color-mix(in srgb, var(--foreground) calc(<alpha-value> * 100%), transparent)",
        primary: {
          DEFAULT: "color-mix(in srgb, var(--color-primary) calc(<alpha-value> * 100%), transparent)",
          dark: "color-mix(in srgb, var(--color-primary-dark) calc(<alpha-value> * 100%), transparent)",
          light: "color-mix(in srgb, var(--color-primary-light) calc(<alpha-value> * 100%), transparent)",
        },
        accent: {
          DEFAULT: "color-mix(in srgb, var(--color-accent) calc(<alpha-value> * 100%), transparent)",
        },
        surface: "color-mix(in srgb, var(--color-surface) calc(<alpha-value> * 100%), transparent)",
        muted: "color-mix(in srgb, var(--color-muted) calc(<alpha-value> * 100%), transparent)",
        border: "color-mix(in srgb, var(--color-border) calc(<alpha-value> * 100%), transparent)",
        cream: "color-mix(in srgb, var(--cream) calc(<alpha-value> * 100%), transparent)",
      },
      // Elements with a bare `border` class get a soft theme border, not Tailwind's default gray.
      borderColor: {
        DEFAULT: "color-mix(in srgb, var(--color-border) 70%, transparent)",
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
