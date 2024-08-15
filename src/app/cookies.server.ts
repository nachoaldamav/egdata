import { createCookie } from '@remix-run/node';

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

export const epic = createCookie('EGDATA_EPIC', {
  maxAge: 31_536_000,
  domain: import.meta.env.DEV ? 'localhost' : '.egdata.app',
  sameSite: 'lax',
  httpOnly: true,
  secure: true,
  path: '/',
  secrets: [process.env.COOKIE_SECRET as string],
});
