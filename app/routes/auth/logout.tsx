import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/logout')({
  component: () => <div>Hello /auth/logout!</div>,

  beforeLoad: async () => {
    redirect({
      to: '/',
      headers: {
        'Set-Cookie':
          'EGDATA_AUTH=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      },
      throw: true,
    });
  },
});
