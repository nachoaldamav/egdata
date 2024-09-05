import { type LoaderFunction, redirect } from '@remix-run/node';
import { authenticator, epicStrategy } from '../services/auth.server';
import { sessionStorage } from '../sessions.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  });

  const session = await sessionStorage.getSession(request.headers.get('Cookie'));

  const tokens = await epicStrategy.refreshToken(user.refreshToken);

  session.set(authenticator.sessionKey, {
    ...user,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expires_at: new Date(Date.now() + 1000 * tokens.expires_in).toISOString(),
  });

  const cookieHeader = await sessionStorage.commitSession(session, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  });

  return redirect('/', {
    headers: {
      'Set-Cookie': cookieHeader,
    },
  });
};
