/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1a2f4e",
          light:   "#243d66",
          deep:    "#0f1e33",
          50:  "#eef2f7",
          100: "#d4dce9",
          200: "#a9bad3",
          300: "#7c97bc",
          400: "#4f75a6",
          500: "#1a2f4e",
          600: "#162845",
          700: "#11203a",
          800: "#0c162a",
          900: "#070d1a",
        },
        gold: {
          DEFAULT: "#c9a84c",
          light:   "#e8c97a",
          deep:    "#a8882a",
          50:  "#fdf8ec",
          100: "#f8edcb",
          200: "#f1da97",
          300: "#e8c97a",
          400: "#d9b44a",
          500: "#c9a84c",
          600: "#b59038",
          700: "#8f6f27",
          800: "#6a5118",
          900: "#46340a",
        },
        cream: {
          DEFAULT: "#faf7f2",
          dark:    "#f0ebe0",
        },
        charcoal: "#1c1c1c",
        muted:    "#6b7280",
        parchment: "#faf7f2",
        "text-dark": "#1c1c1c",
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        serif:   ['"Cormorant Garamond"', "Georgia", "serif"],
        body:    ["Jost", "system-ui", "sans-serif"],
        sans:    ["Jost", "system-ui", "sans-serif"],
        heading: ["Cinzel", "serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(160deg, #0f1e33 0%, #1a2f4e 50%, #243d66 100%)",
        "gold-gradient": "linear-gradient(135deg, #c9a84c 0%, #e8c97a 50%, #c9a84c 100%)",
        "navy-gradient": "linear-gradient(160deg, #0f1e33 0%, #1a2f4e 50%, #243d66 100%)",
      },
      boxShadow: {
        xs:          "0 1px 4px rgba(0,0,0,0.06)",
        card:        "0 4px 20px rgba(0,0,0,0.08)",
        "card-hover":"0 12px 40px rgba(0,0,0,0.16)",
        xl:          "0 24px 60px rgba(0,0,0,0.22)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
