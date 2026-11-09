import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
export default defineConfig({
  publicDir: "app-public",
  plugins: [react(), tailwind()],
  build: { outDir: "dist", sourcemap: true },
});
