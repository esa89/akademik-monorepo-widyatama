import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#373B85",
        secondary: "#EB891A",
        danger: "#F0142F"
      }
    },
  },
  plugins: [],
};

export default config;
