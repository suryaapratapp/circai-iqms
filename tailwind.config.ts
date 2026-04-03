import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#10212b",
        mist: "#eff4f5",
        teal: "#1d4ed8",
        pine: "#1e3a8a",
        ember: "#b45309",
        signal: "#e11d48",
        steel: "#475569",
        warehouse: "#f8fafc",
        panel: "#ffffff"
      },
      boxShadow: {
        warehouse: "0 14px 40px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        "floor-grid":
          "linear-gradient(rgba(29, 78, 216, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(29, 78, 216, 0.05) 1px, transparent 1px)"
      },
      fontFamily: {
        heading: ['ui-rounded', '"Trebuchet MS"', '"Avenir Next"', "sans-serif"],
        body: ['"Avenir Next"', '"Segoe UI"', "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
