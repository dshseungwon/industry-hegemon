import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: { target: "es2020" },
  optimizeDeps: { include: ["three", "globe.gl", "topojson-client"] },
});
