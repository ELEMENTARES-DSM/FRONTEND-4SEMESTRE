import { defineConfig } from "vitest/config";
import baseConfig from "./vite.config.ts";

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ["**/*.integration.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
