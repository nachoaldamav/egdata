import { sentryVitePlugin } from '@sentry/vite-plugin';
import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { RemixVitePWA } from '@vite-pwa/remix';
// import { remixDevTools } from 'remix-development-tools';
const { RemixVitePWAPlugin, RemixPWAPreset } = RemixVitePWA();

export default defineConfig({
  plugins: [
    // remixDevTools(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
      appDirectory: 'src/app',
      presets: [RemixPWAPreset()],
    }),
    tsconfigPaths(),
    RemixVitePWAPlugin({
      registerType: 'autoUpdate',
      srcDir: 'src',
      filename: 'service-worker.ts',
      strategies: 'injectManifest',
      injectRegister: 'auto',
      manifest: false,
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
      },
    }),
    sentryVitePlugin({
      org: 'royale-radar',
      project: 'egdata-website',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: true,
    }),
  ],
  build: {
    sourcemap: true,
  },
});
