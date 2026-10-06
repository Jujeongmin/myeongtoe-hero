import { defineConfig } from "vitest/config";

// server/test runs under gameserver-node's own runner (npm run server:test), not here.
export default defineConfig({
  test: { include: ["shared/**/*.test.ts", "src/**/*.test.ts", "vite-plugins/**/*.test.ts"] },
});
