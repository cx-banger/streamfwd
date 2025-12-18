import { defineConfig } from 'vite';

export default defineConfig({
  base: '/streamfwd/',  // ⚠️ IMPORTANT pour GitHub Pages
  build: {
    outDir: 'docs',
  },
});
