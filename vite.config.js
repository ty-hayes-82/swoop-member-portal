import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';


export default defineConfig({
  plugins: [
    react(),
  ],
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
                id.includes('/react-dom/') ||
                id.includes('/recharts/')
              ) {
                return 'vendor';
              }
              return undefined;
            }

            if (id.includes('/src/landing/')) {
              return 'landing';
            }

            if (id.includes('/src/') && !id.includes('/src/main.jsx')) {
              return 'dashboard';
            }

            return undefined;
          },
        },
      },
    },
});
