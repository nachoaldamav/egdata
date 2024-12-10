import { saveAuthCookie } from '@/lib/cookies';
import type { EpicToken } from '@/types/epic';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const getStateFile = createServerFn({ method: 'GET' })
  .validator((state: string) => state)
  .handler(async (ctx) => {
    return existsSync(join(tmpdir(), 'egdata', ctx.data));
  });

export const getTokens = createServerFn({ method: 'GET' })
  .validator((code: string) => code)
  .handler(async (ctx) => {
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
          code: ctx.data,
          redirect_uri: process.env.EPIC_REDIRECT_URI as string,
        }),
      },
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
    let crypto: Crypto;

    if (import.meta.env.SSR) {
      // @ts-expect-error
      crypto = await import('node:crypto');
    } else {
      crypto = window.crypto;
    }

    const { url } = context;
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      throw redirect({
        to: '/',
        search: { error: 'invalid_request' },
      });
    }

    const stateFile = await getStateFile({ data: state });

    if (!stateFile) {
      throw redirect({
        to: '/',
        search: { error: 'invalid_state' },
      });
    }

    const tokens = await getTokens({ data: code }).catch((error) => {
      console.error(error);
      throw redirect({
        to: '/',
        search: { error: 'invalid_request' },
      });
    });

    const id = crypto.randomUUID().replaceAll('-', '').toUpperCase();

    const token = await saveAuthCookie({
      data: JSON.stringify({
        name: 'EGDATA_AUTH',
        value: {
          ...tokens,
          jti: id,
        },
      }),
    });

    const persistResponse = await fetch(
      'https://api.egdata.app/auth/v2/persist',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!persistResponse.ok) {
      console.error('Failed to persist tokens', await persistResponse.json());
      throw redirect({
        to: '/',
        search: { error: 'perist_error' },
      });
    }

    throw redirect({
      to: '/',
    });
  },
});
