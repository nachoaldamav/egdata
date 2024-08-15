import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { httpClient } from '~/lib/http-client';
import { epic } from '../cookies.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return redirect('/'); // Redirect to the homepage if there is no code
  }

  const response = await httpClient.get<{
    jwt: string;
  }>('/auth/callback', {
    params: {
      code,
    },
  });

  return redirect('/', {
    headers: {
      'Set-Cookie': await epic.serialize(response.jwt),
    },
  });
}
