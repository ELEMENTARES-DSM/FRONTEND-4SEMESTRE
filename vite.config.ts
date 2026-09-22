/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
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
