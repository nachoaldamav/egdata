import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';

const saveStateFile = createServerFn('POST', async () => {
  const { randomUUID } = await import('node:crypto');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { mkdir, writeFile } = await import('node:fs/promises');

  const state = randomUUID().replaceAll('-', '').toUpperCase();
  await mkdir(join(tmpdir(), 'egdata'), { recursive: true });
  await writeFile(join(tmpdir(), 'egdata', state), '');
  return state;
});

export const Route = createFileRoute('/auth/login')({
  component: () => <div>Hello /auth/login!</div>,

  beforeLoad: async ({ context }) => {
    const state = await saveStateFile();

    const epicUrl = new URL('https://www.epicgames.com/id/authorize');
    epicUrl.searchParams.set(
      'client_id',
      import.meta.env.EPIC_CLIENT_ID ?? process.env.EPIC_CLIENT_ID
    );
    epicUrl.searchParams.set('response_type', 'code');
    epicUrl.searchParams.set('scope', 'basic_profile');
    epicUrl.searchParams.set(
      'redirect_uri',
      import.meta.env.EPIC_REDIRECT_URI ?? process.env.EPIC_REDIRECT_URI
    );
    epicUrl.searchParams.set('state', state);

    throw redirect({
      href: epicUrl.toString(),
    });
  },
});
