import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: 'royale-radar',
      project: 'egdata',
    }),
    tanstackStart({
      target: 'bun',
    }),
  ],
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
});
