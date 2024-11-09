import { deleteCookie } from '@/lib/cookies';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/logout')({
  component: () => <div>Hello /auth/logout!</div>,

  beforeLoad: async () => {
    if (import.meta.env.SSR) {
      const { deleteCookie } = await import('vinxi/http');
      deleteCookie('EGDATA_AUTH');
    } else {
      await deleteCookie('EGDATA_AUTH');
    }

    throw redirect({
      to: '/',
    });
  },
});
