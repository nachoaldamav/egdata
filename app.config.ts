import { defineConfig } from '@tanstack/start/config';
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
    },
  },
  server: {
    preset: 'node-server',
  },
  tsr: {
    disableLogging: true,
    autoCodeSplitting: true,
  },
});
