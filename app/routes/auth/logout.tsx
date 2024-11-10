import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/logout')({
  component: () => <div>Hello /auth/logout!</div>,

  beforeLoad: async () => {
    redirect({
      // @ts-expect-error
      to: '/api/logout',
      throw: true,
    });
  },
});
