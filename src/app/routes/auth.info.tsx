import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { httpClient } from '~/lib/http-client';
import { epic } from '../cookies.server';
import { useLoaderData } from '@remix-run/react';
import { decode } from 'jsonwebtoken';

export async function loader({ request }: LoaderFunctionArgs) {
  const cookies = request.headers.get('Cookie');
  if (!cookies) {
    return redirect('/auth/login');
  }

  const authCookie = await epic.parse(cookies);

  if (!authCookie) {
    return redirect('/auth/login');
  }

  const decoded = decode(authCookie) as { id: string } | null;

  if (!decoded) {
    return redirect('/auth/login');
  }

  const data = await httpClient
    .get<{
      account_id: string;
    }>(`/auth/tokens/${decoded.id}`, {
      headers: {
        Authorization: `Bearer ${authCookie}`,
      },
    })
    .catch(() => {
      return null;
    });

  if (!data || !data.account_id) {
    return redirect('/auth/login');
  }

  const account = await fetch('http://localhost:4000/accounts', {
    headers: {
      Authorization: `Bearer ${authCookie}`,
    },
  }).then((res) => res.json());

  return json({
    account_id: data.account_id,
    account,
  });
}

export default function AuthInfo() {
  const { account_id, account } = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>Account ID: {account_id}</h1>
      <pre>
        <code>{JSON.stringify(account, null, 2)}</code>
      </pre>
    </div>
  );
}
