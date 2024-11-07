import { saveAuthCookie } from '@/lib/cookies';
import type { EpicToken } from '@/types/epic';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const getStateFile = createServerFn('GET', async (state: string) => {
  return existsSync(join(tmpdir(), 'egdata', state));
});

const getTokens = createServerFn('GET', async (code: string) => {
  const ClientID = process.env.EPIC_CLIENT_ID;
  const ClientSecret = process.env.EPIC_CLIENT_SECRET;

  const response = await fetch(
    'https://api.epicgames.dev/epic/oauth/v2/token',
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${ClientID}:${ClientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.EPIC_REDIRECT_URI as string,
      }),
    }
  );

  if (response.ok) {
    const data = (await response.json()) as EpicToken;
    return data;
  }

  console.error(response.status, await response.json());
  throw new Error('Failed to get token');
});

export const Route = createFileRoute('/auth/callback')({
  component: () => <div>Hello /auth/callback!</div>,

  beforeLoad: async ({ context }) => {
    const { url } = context;
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      throw redirect({
        to: '/',
        search: { error: 'invalid_request' },
      });
    }

    const stateFile = await getStateFile(state);

    if (!stateFile) {
      throw redirect({
        to: '/',
        search: { error: 'invalid_state' },
      });
    }

    const tokens = await getTokens(code).catch((error) => {
      console.error(error);
      throw redirect({
        to: '/',
        search: { error: 'invalid_request' },
      });
    });

    console.log(tokens);

    const token = await saveAuthCookie(
      JSON.stringify({ name: 'EGDATA_AUTH', value: tokens })
    );

    const persistResponse = await fetch(
      'https://api.egdata.app/auth/v2/persist',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!persistResponse.ok) {
      console.error(await persistResponse.json());
      throw redirect({
        to: '/',
        search: { error: 'perist_error' },
      });
    }

    const { id } = await persistResponse.json();

    const tokenWithId = { ...tokens, id: id as string };

    await saveAuthCookie(
      JSON.stringify({ name: 'EGDATA_AUTH', value: tokenWithId })
    );

    throw redirect({
      to: '/',
    });
  },
});