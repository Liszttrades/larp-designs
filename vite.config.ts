import { defineConfig } from "vite";
import { resolve } from "node:path";

// relative base: works on GitHub Pages sub-paths and on Vercel
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        privacy: resolve(import.meta.dirname, "privacy.html"),
      },
    },
  },
});
