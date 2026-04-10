import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      '/google-weather-proxy': {
        target: 'https://weather.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google-weather-proxy/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('/recharts/') || id.includes('/d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('/xlsx/')) {
              return 'vendor-xlsx';
            }
            return undefined;
          }
          // Everything under src/ is auto-split by Vite via React.lazy boundaries
          // in App.jsx and main.jsx. Directory-based buckets previously forced
          // page-members + mobile + page-admin + page-board-report into the
          // initial preload graph and caused a mobile <-> page-members circular.
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    // Only include unit tests colocated in src/. Playwright e2e specs live in
    // tests/e2e/ and use @playwright/test, so they must be excluded from vitest.
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/**',
      '.claude/**',
    ],
    environmentOptions: {
      jsdom: {
        url: 'https://swoop.local/#/',
      },
    },
  },
});
