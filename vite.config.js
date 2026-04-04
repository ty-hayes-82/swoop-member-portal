import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
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
          if (id.includes('/src/features/member-profile/')) return 'page-member-profile';
          if (id.includes('/src/features/member-health/')) return 'page-member-health';
          if (id.includes('/src/mobile/')) return 'mobile';

          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    environmentOptions: {
      jsdom: {
        url: 'https://swoop.local/#/',
      },
    },
  },
});
