import { json } from '@tanstack/start';
import { createAPIFileRoute } from '@tanstack/start/api';
import consola from 'consola';
import { URLSearchParams } from 'node:url';

export const APIRoute = createAPIFileRoute('/api/token')({
  GET: ({ request, params }) => {
    consola.info('GET /api/token', { request, params });
    return json({ message: 'Hello "/api/token"!' });
  },
  POST: async ({ request, params }) => {
    const body = await request.formData();

    let ClientID: string | undefined;
    let ClientSecret: string | undefined;

    if (request.cloudflare) {
      ClientID = request.cloudflare.env.EPIC_CLIENT_ID;
      ClientSecret = request.cloudflare.env.EPIC_CLIENT_SECRET;
    } else {
      ClientID = process.env.EPIC_CLIENT_ID;
      ClientSecret = process.env.EPIC_CLIENT_SECRET;
    }

    // grant_type=authorization_code&code=d602bbd293f7437fba8307d60a73d75d&code_verifier=Obe2XjTtrGmjnGFRqXkmHZolYxh6uze8vyYcacBIcu7b2gyx1P4eUEqRm0lIjdKTcwZA35KCaV8MLFTv_U61bT5LoJtT9ZLoYJox8_LJr6erGD3CYDdwBxCwLCbEYUM2&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Foauth2%2Fcallback%2Fepic&client_id=xyza7891xZ38uWZ6zLt8enN8oNxlLvWf&client_secret=njIEx6Gmm%2B6t0u0jl6rj1MZQ7N5BnwTUsLQ9ugZkZ1A

    const grantType = body.get('grant_type');
    const code = body.get('code');
    const codeVerifier = body.get('code_verifier');
    const redirectURI = body.get('redirect_uri');
    const clientID = body.get('client_id');
    const clientSecret = body.get('client_secret');

    if (
      !grantType ||
      !code ||
      !codeVerifier ||
      !redirectURI ||
      !clientID ||
      !clientSecret
    ) {
      return json(
        { message: 'Invalid request' },
        {
          status: 400,
        },
      );
    }

    const searchParams = new URLSearchParams();

    searchParams.append('code', code.toString());
    searchParams.append('grant_type', grantType.toString());

    const response = await fetch(
      'https://api.epicgames.dev/epic/oauth/v2/token',
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${ClientID}:${ClientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: searchParams,
      },
    );

    if (!response.ok) {
      console.error(
        'Failed to save state',
        response.status,
        await response.json(),
      );
      throw new Error('Failed to save state');
    }

    return json(await response.json());
  },
});
