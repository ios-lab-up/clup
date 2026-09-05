import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // Guard de build-time de Next.js; en tests corre en Node plano.
      "server-only": "node_modules/server-only/empty.js",
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
