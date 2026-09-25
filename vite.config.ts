/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

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
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    isolate: true,
    setupFiles: ['./src/setupTests.ts'],
    pool: 'threads',
    css: false,
    coverage: {
      enabled: true,
      reporter: ['text', 'html'], 
    },
  },
})
