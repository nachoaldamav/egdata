import { defineConfig } from '@tanstack/start/config';
import path, { basename, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

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
          manualChunks: {
            ...(glob
              .sync(join(__dirname, 'components', 'ui', '*.tsx'))
              .reduce((acc, file) => {
                const name = basename(file, '.tsx');
                acc[name] = [`@/${relative(__dirname, file)}`];
                return acc;
              }, {}) as Record<string, string[]>),
          },
        },
      },
    },
  },
  server: {
    preset: 'node-server',
  },
});
