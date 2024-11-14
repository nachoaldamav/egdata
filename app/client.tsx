/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/start';
import { createRouter } from './router';
import './styles.css';
import consola from 'consola';

const router = createRouter();

hydrateRoot(document, <StartClient router={router} />, {
  onRecoverableError(error, errorInfo) {
    consola.error(error);
    consola.error(errorInfo.componentStack);
  },
});
