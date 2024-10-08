/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import Bugsnag from '@bugsnag/js';
import type { BugsnagErrorBoundary } from '@bugsnag/plugin-react';
import { RemixBrowser } from '@remix-run/react';
import React, { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';

const ErrorBoundary = Bugsnag.getPlugin('react')?.createErrorBoundary(
  React,
) as BugsnagErrorBoundary;

startTransition(() => {
  hydrateRoot(
    document,
    <ErrorBoundary>
      <RemixBrowser />
    </ErrorBoundary>,
  );
});
