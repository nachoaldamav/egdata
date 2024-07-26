import { createCookie } from '@remix-run/node'; // or cloudflare/deno

export const selectedCountry = createCookie('EGDATA_COUNTRY', {
  maxAge: 31_536_000,
  domain: '.egdata.app',
  sameSite: 'lax',
  path: '/',
});

export const userPrefs = createCookie('EGDATA_USER_PREFS', {
  // No expiration
  maxAge: 31_536_000,
});
