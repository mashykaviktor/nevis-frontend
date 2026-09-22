import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // @vitejs/plugin-react stays pinned to 4.7.0 (not upgraded to 6) since
  // that major requires Vite 8 + Node >=20.19, which would break this
  // project's deliberate Vite 6 / Node 18.18 pin.
  plugins: [react({ babel: { plugins: [['babel-plugin-react-compiler', {}]] } })],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
