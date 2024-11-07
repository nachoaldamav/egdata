import { deleteCookie } from '@/lib/cookies';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/logout')({
  component: () => <div>Hello /auth/logout!</div>,

  beforeLoad: async () => {
    await deleteCookie('EGDATA_AUTH');

    throw redirect({
      to: '/',
    });
  },
});
