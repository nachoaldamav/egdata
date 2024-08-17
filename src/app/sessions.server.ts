import { createCookieSessionStorage } from '@remix-run/node';

// export the whole sessionStorage object
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'EGDATA_AUTH',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: [process.env.COOKIE_SECRET as string],
    secure: process.env.NODE_ENV === 'production',
    domain: import.meta.env.DEV ? 'localhost' : '.egdata.app',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
