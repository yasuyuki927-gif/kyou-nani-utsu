import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        brand: "#e84d6a",
        gold: "#f8b84e",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 32, 51, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
