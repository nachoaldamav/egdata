import { defineConfig } from '@tanstack/react-start/config';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  vite: {
    plugins: [
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: 'royale-radar',
        project: 'egdata',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname),
      },
    },
    build: {
      minify: 'oxc',
      sourcemap: true,
    },
    ssr: {
      noExternal: [
        '@react-spectrum/image',
        '@react-spectrum/provider',
        '@vidstack/react',
      ],
    },
  },
  server: {
    preset: 'node-server',
  },
});
