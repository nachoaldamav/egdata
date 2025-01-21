import { decodeJwt } from '@/lib/cookies';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: () => <div>Hello /dashboard!</div>,

  beforeLoad: async ({ context }) => {
    if (context.epicToken) {
      throw redirect({ to: `/profile/${context.epicToken.account_id}` });
    }

    if (context.cookies.EGDATA_AUTH) {
      const epicToken = await decodeJwt({ data: context.cookies.EGDATA_AUTH });
      if (epicToken) {
        throw redirect({ to: `/profile/${epicToken.account_id}` });
      }
    }

    throw redirect({ to: '/api/auth/login' });
  },

  preload: false,
});
