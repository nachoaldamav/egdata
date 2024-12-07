import { createAPIFileRoute } from '@tanstack/start/api';

export const APIRoute = createAPIFileRoute('/api/logout')({
  GET: async () => {
    const headers = new Headers({
      Location: 'https://api.egdata.app/auth/logout',
    });

    return new Response(null, {
      status: 302,
      headers,
    });
  },
});
