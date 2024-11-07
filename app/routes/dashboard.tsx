import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: () => <div>Hello /dashboard!</div>,

  beforeLoad: async ({ context }) => {
    if (context.epicToken) {
      throw redirect({ to: `/profile/${context.epicToken.account_id}` });
    }

    throw redirect({ to: '/auth/login' });
  },
});
