/// <reference types="vinxi/types/client" />
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/start';
import { createRouter } from './router';
import './styles.css';
import consola from 'consola';

const router = createRouter();

hydrateRoot(
  document.getElementById('root') as HTMLElement,
  <StrictMode>
    <StartClient router={router} />
  </StrictMode>,
  {
    onRecoverableError(error, errorInfo) {
      consola.error(error);
      consola.error(errorInfo.componentStack);
    },
  },
);
