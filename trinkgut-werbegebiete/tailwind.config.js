/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#faf8f3",
          100: "#f4f2ec",
          200: "#ebe7dc",
          300: "#d9d3c2",
        },
        trinkgut: {
          DEFAULT: "#c8102e",
          dark: "#a50d25",
          light: "#e5334d",
        },
        ink: {
          900: "#1a1a1a",
          700: "#3a3a3a",
          500: "#6b6b6b",
          400: "#8a8a8a",
        },
      },
      fontFamily: {
        display: [
          '"Fraunces"',
          '"Instrument Serif"',
          "Georgia",
          "serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
        cardHover: "0 2px 6px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
