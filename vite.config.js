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
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/')
            ) {
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

          if (id.includes('/src/landing/')) {
            return 'landing';
          }

          // Split feature pages into separate chunks for lazy loading
          if (id.includes('/src/features/board-report/')) return 'page-board-report';
          if (id.includes('/src/features/admin/')) return 'page-admin';
          if (id.includes('/src/features/playbooks/')) return 'page-playbooks';
          if (id.includes('/src/features/integrations/')) return 'page-integrations';
          if (id.includes('/src/features/member-profile/')) return 'page-members';
          if (id.includes('/src/features/member-health/')) return 'page-members';
          if (id.includes('/src/mobile/')) return 'mobile';

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
