import { defineConfig } from '@tanstack/start/config';
import { cloudflare } from 'unenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname),
      },
    },
    build: {
      minify: 'terser',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // If the id contains @/components/ui, it's a component
            if (id.includes('components/ui')) {
              return id.split('/').pop()?.replace('.tsx', '');
            }

            return undefined;
          },
        },
      },
    },
    ssr: {
      noExternal: ['@react-spectrum/image', '@react-spectrum/provider'],
    },
  },
  server: {
    preset: 'cloudflare-pages',
    unenv: cloudflare,
  },
  tsr: {
    disableLogging: true,
    autoCodeSplitting: true,
  },
});
