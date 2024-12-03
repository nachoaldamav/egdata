/// <reference types="vinxi/types/server" />
import {
  createStartHandler,
  defaultRenderHandler,
} from '@tanstack/start/server';
import { getRouterManifest } from '@tanstack/start/router-manifest';

import { createRouter } from './router';

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultRenderHandler);
