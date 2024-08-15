import { type LoaderFunctionArgs, redirect } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  const redirectUrl = new URL(process.env.APP_URL ?? request.url);
  redirectUrl.pathname = '/auth/callback';

  if (!process.env.COOKIE_SECRET) {
    throw new Error('Secrets are required to use cookies');
  }

  return redirect(
    `https://api.egdata.app/auth/login?redirect=${encodeURIComponent(redirectUrl.toString())}`,
  );
}
