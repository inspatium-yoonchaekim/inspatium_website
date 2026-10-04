import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { publicContentPlugin } from './scripts/content-visibility.mjs';

export default defineConfig({
  plugins: [publicContentPlugin(), react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
