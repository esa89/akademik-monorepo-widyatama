import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
    cssInjectedByJsPlugin(), // Inject CSS ke head HTML
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "WidyatamaUI",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "clsx", "lucide-react"], // tetap dipertahankan
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
