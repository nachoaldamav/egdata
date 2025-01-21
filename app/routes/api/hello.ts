import { createAPIFileRoute } from '@tanstack/start/api';

export const APIRoute = createAPIFileRoute('/api/hello')({
  GET: async ({ request }) => {
    console.log('Request', request);
    return new Response('Hello World!');
  },
});
