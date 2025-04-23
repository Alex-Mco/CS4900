import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', // Use jsdom for React component testing
    include: ['src/tests/**/*.test.jsx'], // Only run frontend tests
    exclude: [...configDefaults.exclude, 'backend/**'], // Exclude backend tests
  },
});
