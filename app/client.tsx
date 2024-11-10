/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/start';
import { createRouter } from './router';
import './styles.css';

const router = createRouter();

hydrateRoot(document.getElementById('root')!, <StartClient router={router} />, {
  onRecoverableError(error, errorInfo) {
    console.error(error);
    console.error(errorInfo.componentStack);
  },
});
