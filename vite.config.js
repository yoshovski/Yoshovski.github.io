import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', 
  publicDir: 'public', // Prende tutte le risorse direttamente dalla root
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});