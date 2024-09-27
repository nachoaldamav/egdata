import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { RemixVitePWA } from '@vite-pwa/remix';

const { RemixVitePWAPlugin, RemixPWAPreset } = RemixVitePWA();

export default defineConfig({
  plugins: [
    // remixDevTools(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        unstable_singleFetch: true,
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
  ],
  build: {
    sourcemap: true,
  },
  ssr: {
    noExternal: [
      '@adobe/react-spectrum',
      /^@react-spectrum\/.*/,
      /^@spectrum-icons\/.*/,
      /^@react-aria\/.*/,
      '@react-aria/virtualizer',
    ],
  },
});
