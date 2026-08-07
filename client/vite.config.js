import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Read the single .env at the repository root (shared with the server),
  // so a production build picks up VITE_API_URL from the same file.
  envDir: '..',
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to the Express server during development
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
