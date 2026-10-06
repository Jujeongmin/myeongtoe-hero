import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Verse8 serves the game from a sub-path; root-absolute URLs 404 there.
  base: "./",
  // Two React copies (SDK peer dep) cause "Invalid hook call"; pin one.
  resolve: { dedupe: ["react", "react-dom"] },
});
