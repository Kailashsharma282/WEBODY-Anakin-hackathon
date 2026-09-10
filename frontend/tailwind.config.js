/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06080f",
        surface: "#0c101d",
        "surface-elevated": "#141b2d",
        "surface-border": "#1f293d",
        hud: {
          cyan: "#00f0ff",
          emerald: "#10b981",
          amber: "#f59e0b",
          violet: "#a855f7",
          rose: "#f43f5e",
        }
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { opacity: "0.4", filter: "drop-shadow(0 0 4px #00f0ff)" },
          "100%": { opacity: "0.9", filter: "drop-shadow(0 0 12px #00f0ff)" },
        }
      }
    },
  },
  plugins: [],
};
