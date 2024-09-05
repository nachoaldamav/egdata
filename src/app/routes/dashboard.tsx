import { authenticator } from '../services/auth.server';
import { type LoaderFunctionArgs, redirect } from '@remix-run/node';
import { getSession } from '../sessions.server';
import consola from 'consola';
import { getAccountFromDb } from '~/lib/get-epic-account.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const cookies = request.headers.get('Cookie');
  const user = await authenticator.isAuthenticated(request);

  const token = await getSession(cookies);

  if (!user) {
    consola.info('User not authenticated, missing user');
    return redirect('/login');
  }

  if (!token) {
    consola.info('User not authenticated, missing token');
    return redirect('/login');
  }

  const userData = await getAccountFromDb(user.accessToken).catch(() => null);

  if (!userData) {
    consola.info('API returned null user data');
    return redirect('/login');
  }

  return redirect(`/profile/${userData.accountId}`);
}
