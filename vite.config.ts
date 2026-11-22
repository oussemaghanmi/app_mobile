import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Les tests Deno des Edge Functions et les tests Playwright ont leurs propres lanceurs.
    exclude: [...configDefaults.exclude, 'supabase/functions/**', 'e2e/**'],
    css: false,
  },
});
