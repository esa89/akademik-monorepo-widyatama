import type { Config } from "tailwindcss";
import scrollhide from "tailwind-scrollbar-hide";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@widyatama/ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#373B85",
        secondary: "#EB891A",
        danger: "#F0142F",
      },
    },
  },
  plugins: [
    scrollhide,
  ],
};

export default config;
