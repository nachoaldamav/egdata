import { type LoaderFunction, redirect } from '@remix-run/node';
import consola from 'consola';
import { authenticator } from '../services/auth.server';
import { sessionStorage } from '../sessions.server';
import { refreshToken } from '~/lib/refresh-discord.server';

export const loader: LoaderFunction = async ({ request }) => {
  const currentSession = await authenticator.isAuthenticated(request);

  if (!currentSession) {
    return redirect('/login');
  }

  if (!currentSession.expires_at) {
    return redirect('/logout');
  }

  if (new Date(currentSession.expires_at).getTime() < Date.now()) {
    // Get the new tokens from Discord directly, as Remix auth does not provide a way to refresh the tokens
    const response = await refreshToken(currentSession.refreshToken);

    if (!response.ok) {
      consola.error('Error from Discord', await response.json());
      return redirect('/login', {
        headers: {
          'Set-Cookie': await sessionStorage.destroySession(request.headers.get('Cookie')),
        },
      });
    }

    const { access_token, refresh_token, expires_in } = await response.json();

    const session = await sessionStorage.getSession(request.headers.get('Cookie'));

    const userData = session.get('user');

    const newUserData = {
      ...userData,
      accessToken: access_token,
      refreshToken: refresh_token,
      expires_at: new Date(Date.now() + 1000 * expires_in).toISOString(),
    };

    session.set('user', newUserData);

    const cookieHeader = await sessionStorage.commitSession(session, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });

    return redirect('/', {
      headers: {
        'Set-Cookie': cookieHeader,
      },
    });
  }

  return redirect('/');
};
