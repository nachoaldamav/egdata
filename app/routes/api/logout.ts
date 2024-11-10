import { createAPIFileRoute } from '@tanstack/start/api';

export const Route = createAPIFileRoute('/api/logout')({
  GET: async () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Set-Cookie':
        'EGDATA_AUTH=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict',
      Location: '/',
    });

    return new Response(null, {
      status: 302,
      headers,
    });
  },
});
