import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/app',
  base: './',
  define: {
    'import.meta.env.VITE_PLATFORM': JSON.stringify('app'),
    'import.meta.env.VITE_API_BASE': JSON.stringify('/api'),
  },
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
  },
  build: {
    outDir: '../../dist/app',
    sourcemap: false,
  },
});
