import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Allows using globals like `expect` without importing
    environment: 'jsdom', // Browser-like environment for testing
    setupFiles: './src/setupTests.js', // Optional setup file for global test configurations
  },
})
