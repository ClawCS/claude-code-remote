/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#faf8f3",
          100: "#f4f2ec",
          200: "#ece7db",
          300: "#ddd6c2",
        },
        trinkgut: {
          DEFAULT: "#c8102e",
          dark: "#a30d25",
          light: "#e3334e",
        },
        ink: {
          900: "#1a1814",
          700: "#3a362d",
          500: "#6a6458",
          300: "#9a9488",
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', "ui-serif", "Georgia", "serif"],
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,24,20,0.04), 0 4px 16px rgba(26,24,20,0.06)",
        cardHover: "0 2px 4px rgba(26,24,20,0.06), 0 8px 24px rgba(26,24,20,0.10)",
      },
    },
  },
  plugins: [],
};
