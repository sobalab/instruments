import { defineConfig } from 'vite';

// DRIFT is a static, dependency-light single-page studio.
// Relative base so the build can be dropped onto any static host / subpath.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
