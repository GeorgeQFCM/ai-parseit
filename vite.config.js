import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          "element-plus": ["element-plus"],
          pdf: ["pdfjs-dist"],
          xlsx: ["xlsx"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["element-plus", "xlsx", "pdfjs-dist"],
  },
});
