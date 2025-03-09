import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Yoshovski.github.io/',
  build: {
    chunkSizeWarningLimit: 1000 // Aumenta il limite di avviso per i chunk
  }
});