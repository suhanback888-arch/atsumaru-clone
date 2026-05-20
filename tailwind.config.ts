import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#7c5cfc",
          dark: "#6a4de0",
          light: "#9b82fc",
        },
        surface: {
          DEFAULT: "#1a1a2e",
          light: "#222240",
          lighter: "#2a2a4a",
          dark: "#12121f",
        },
        accent: "#7c5cfc",
      },
    },
  },
  plugins: [],
};
export default config;
