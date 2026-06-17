import { defineConfig } from 'vite';

export default defineConfig({
  // This is a user/org Pages repo (yoshovski.github.io) served at the domain
  // root, so assets must be referenced from '/', not a project sub-path.
  base: '/',
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  }
});