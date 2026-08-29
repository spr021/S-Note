import { defineConfig } from "vite";
import { resolve } from "path";

const root = resolve(__dirname, "src");
const isDev = process.env.__DEV__ === "true";

/**
 * Content scripts are classic scripts in Chrome. Building this entry alone as
 * an IIFE keeps the complete controller, storage, and anchoring code in one
 * directly injectable file with no runtime import() boundary.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@src": root,
      "@assets": resolve(root, "assets"),
      "@pages": resolve(root, "pages"),
    },
  },
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: false,
    sourcemap: isDev,
    lib: {
      entry: resolve(root, "pages", "content", "index.ts"),
      name: "SNoteContent",
      formats: ["iife"],
      fileName: () => "src/pages/content/index.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
