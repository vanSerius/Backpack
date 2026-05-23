import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Backpack/',
  build: {
    outDir: 'dist',
    target: 'es2020',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  server: {
    host: true,
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
  },
});
