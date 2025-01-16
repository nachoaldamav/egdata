import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || '',
  plugins: [genericOAuthClient()],
});
