import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/agents/**/*.test.{js,ts}'],
    root: resolve(__dirname, '../..'),
  },
});
