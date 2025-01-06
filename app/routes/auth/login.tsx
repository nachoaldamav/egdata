import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';

export const saveStateFile = createServerFn({ method: 'GET' }).handler(
  async (ctx) => {
    console.log('Saving state', ctx);
    // Replace with an API call to save the state on the server
    const response = await fetch('https://api.egdata.app/auth/v2/save-state', {
      method: 'POST',
    });

    if (!response.ok) {
      console.error(
        'Failed to save state',
        response.status,
        await response.json(),
      );
      throw new Error('Failed to save state');
    }

    const { state } = await response.json();
    return state;
  },
);

export const Route = createFileRoute('/auth/login')({
  component: () => <div>Hello /auth/login!</div>,

  beforeLoad: async (ctx) => {
    console.log('Before load', ctx);
    const state = await saveStateFile({ data: undefined });

    const epicUrl = new URL('https://www.epicgames.com/id/authorize');
    epicUrl.searchParams.set(
      'client_id',
      import.meta.env.EPIC_CLIENT_ID ?? process.env.EPIC_CLIENT_ID,
    );
    epicUrl.searchParams.set('response_type', 'code');
    epicUrl.searchParams.set('scope', 'basic_profile');
    epicUrl.searchParams.set(
      'redirect_uri',
      import.meta.env.EPIC_REDIRECT_URI ?? process.env.EPIC_REDIRECT_URI,
    );
    epicUrl.searchParams.set('state', state);

    throw redirect({
      href: epicUrl.toString(),
    });
  },
});
