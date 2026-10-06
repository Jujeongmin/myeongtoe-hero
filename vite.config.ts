import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { cssCacheBust } from "./vite-plugins/cssCacheBust.ts";

export default defineConfig({
  // cssCacheBust: the editor container caches .css for 4 hours; see the plugin.
  plugins: [react(), cssCacheBust()],
  // Verse8 serves the game from a sub-path; root-absolute URLs 404 there.
  base: "./",
  // Two React copies (SDK peer dep) cause "Invalid hook call"; pin one.
  resolve: { dedupe: ["react", "react-dom"] },
  optimizeDeps: {
    include: ["@agent8/gameserver", "react", "react-dom", "react/jsx-runtime"],
  },
  server: {
    watch: { ignored: ["**/.git/**", "**/node_modules/**", "**/dist/**", "**/.superpowers/**"] },
  },
  build: { outDir: "dist", reportCompressedSize: false, chunkSizeWarningLimit: 5000 },
});
