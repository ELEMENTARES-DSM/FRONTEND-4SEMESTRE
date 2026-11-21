import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/auth": "http://localhost:80",
      "/usuarios": "http://localhost:80",
      "/estacoes": "http://localhost:80",
      "/alertas": "http://localhost:80",
      "/analise": "http://localhost:80",
      "/relatorios": "http://localhost:80",
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    isolate: true,
    setupFiles: ["./src/setupTests.ts", "./src/test/setup.ts"],
    pool: "threads",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.integration.{test,spec}.{ts,tsx}",
    ],
    // Folga para máquina carregada: o primeiro teste de uma tela pesada passou de 5 s com CI e Docker rodando juntos.
    testTimeout: 15_000,
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: [
        "src/components/**/*.{ts,tsx}",
        "src/hooks/**/*.{ts,tsx}",
        "src/services/**/*.{ts,tsx}",
        "src/utils/**/*.{ts,tsx}",
      ],
      exclude: [
        "src/mocks/**",
        "src/main.tsx",
        "src/setupTests.ts",
        "src/test/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
