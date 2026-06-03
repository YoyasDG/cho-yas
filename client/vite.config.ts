import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react()],
  server: {
    open: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:5174',
    },
  },
  build: {
    outDir: resolve(__dirname, '..', 'dist', 'client'),
    emptyOutDir: true,
  },
});
