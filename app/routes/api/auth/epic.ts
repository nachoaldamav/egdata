import { json } from '@tanstack/start';
import { createAPIFileRoute } from '@tanstack/start/api';
import consola from 'consola';

export const APIRoute = createAPIFileRoute('/api/auth/epic')({
  GET: ({ request, params }) => {
    consola.info('GET /api/auth/epic', { request, params });
    return json({ message: 'Hello "/api/auth/epic"!' });
  },
});
