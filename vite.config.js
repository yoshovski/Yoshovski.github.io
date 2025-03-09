import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Yoshovski.github.io/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['three', 'gsap', 'dat.gui']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Aumenta il limite di avviso per i chunk
  }
});