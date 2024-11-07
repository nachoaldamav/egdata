/// <reference types="vinxi/types/server" />
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/start/server';
import { getRouterManifest } from '@tanstack/start/router-manifest';
import './styles.css';

import { createRouter } from './router';

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler);
