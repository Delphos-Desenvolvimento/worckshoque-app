import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawApiUrl = (env.VITE_API_URL || '').trim();
  const normalized = rawApiUrl.replace(/[/.]+$/, '').replace(/\/+$/, '');
  const apiTarget = normalized
    ? normalized.replace(/\/api$/i, '')
    : 'http://localhost:3025';

  return {
    server: {
      host: "::",
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: apiTarget,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (
              id.includes('node_modules/react-pdf') ||
              id.includes('node_modules/pdfjs-dist')
            ) {
              return 'pdf-vendor';
            }
            if (id.includes('node_modules/recharts')) {
              return 'charts-vendor';
            }
            if (id.includes('node_modules/xlsx')) {
              return 'xlsx-vendor';
            }
            if (id.includes('node_modules/framer-motion')) {
              return 'motion-vendor';
            }
            if (id.includes('node_modules/date-fns')) {
              return 'date-vendor';
            }
            if (
              id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/scheduler')
            ) {
              return 'react-vendor';
            }
            if (
              id.includes('node_modules/@radix-ui') ||
              id.includes('node_modules/@tanstack') ||
              id.includes('node_modules/zustand') ||
              id.includes('node_modules/next-themes') ||
              id.includes('node_modules/sonner')
            ) {
              return 'ui-vendor';
            }
            return 'vendor';
          },
        },
      },
    },
  };
});
