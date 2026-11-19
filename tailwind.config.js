/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF8F1",
          100: "#FEECDC",
          200: "#FCD9BD",
          300: "#FDBA8C",
          400: "#FA8B28",
          500: "#F6821F", // Cloudflare Primary Trademark Tangerine
          600: "#E0690B",
          700: "#BA5008",
          800: "#943D0C",
          900: "#77320D",
          950: "#431705",
        },
        cyber: {
          bg: "#0A0D14",
          card: "#111622",
          cardHover: "#151B2A",
          input: "#0B0F17",
          border: "#1E2638",
          borderSubtle: "rgba(255, 255, 255, 0.08)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        "brand-glow": "0 0 24px rgba(246, 130, 31, 0.25)",
        "brand-glow-lg": "0 0 40px rgba(246, 130, 31, 0.35)",
        "tactile-primary": "inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 1px 2px rgba(0, 0, 0, 0.15)",
        "tactile-dark": "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.2)",
        "card-dark": "0 20px 50px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        "card-light": "0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.25s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
