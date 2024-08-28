import { httpClient } from '~/lib/http-client';
import { authenticator, type DiscordUser } from '../services/auth.server';
import { type ActionFunctionArgs, json, type LoaderFunctionArgs, redirect } from '@remix-run/node';
import { getSession } from '../sessions.server';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { useEffect, useState } from 'react';
import { ArrowRight, LinkIcon } from 'lucide-react';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { ReloadIcon } from '@radix-ui/react-icons';
import consola from 'consola';

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

  const userData = await httpClient
    .get<DiscordUser>('/users/discord', {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
      retries: 1,
    })
    .catch(() => null);

  if (!userData) {
    consola.info('API returned null user data');
    return redirect('/login');
  }

  return {
    user,
    data: userData,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('action') as 'check' | 'link' | 'unlink';
  const user = await authenticator.isAuthenticated(request);

  if (!user) {
    return redirect('/login');
  }

  try {
    switch (action) {
      case 'check':
        return await handleCheckAction(formData);
      case 'link':
        return await handleLinkAction(formData, user);
      case 'unlink':
        return await handleUnlinkAction(user);
      default:
        return json({ ok: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCheckAction(formData: FormData) {
  const url = formData.get('url') as string;

  if (!URL.canParse(url)) {
    return json({ ok: false, error: 'Invalid URL' }, { status: 400 });
  }

  const epicId = new URL(url).pathname.split('/').pop();
  if (!epicId || epicId.length !== 32) {
    return json({ ok: false, error: 'Invalid Epic ID' }, { status: 400 });
  }

  console.log('Checking Epic ID:', epicId);

  const epicData = await httpClient
    .get('/users/check-epic', { params: { id: epicId }, retries: 1 })
    .catch(() => null);

  if (!epicData) {
    return json({ ok: false, error: 'Failed to check Epic ID' }, { status: 500 });
  }

  return json({ ok: true, profile: epicData });
}

async function handleLinkAction(formData: FormData, user: DiscordUser) {
  const epicId = formData.get('epicId') as string;

  console.log('Linking Epic ID:', epicId);

  const linkData = await httpClient
    .put(
      '/users/epic',
      { id: epicId },
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params: { id: epicId },
        retries: 1,
      },
    )
    .catch((err) => {
      console.error(err.message);
      return null;
    });

  if (!linkData) {
    return json({ ok: false, error: 'Failed to link Epic ID' }, { status: 500 });
  }

  return json({ ok: true, linked: true });
}

async function handleUnlinkAction(user: DiscordUser) {
  console.log('Unlinking Epic ID');

  const unlinkData = await httpClient
    .delete('/users/epic', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
      retries: 1,
    })
    .catch((err) => {
      console.error(err.message);
      return null;
    });

  if (!unlinkData) {
    return json({ ok: false, error: 'Failed to unlink Epic ID' }, { status: 500 });
  }

  return json({ ok: true, unlinked: true });
}

export default function Dashboard() {
  const { user, data } = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col items-start justify-start h-screen">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Welcome back, <span className="font-semibold">{user.displayName}!</span>
      </p>
      <hr className="w-full my-4 border-gray-300/25" />

      {!data.epicId && (
        <div className="mx-auto mt-4">
          <MultistepLinkAccount />
        </div>
      )}
      {data.epicId && (
        <div className="mx-auto mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Epic Account</CardTitle>
              <CardDescription>
                This is your Epic Games account linked to your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <LinkIcon className="size-4 text-muted-foreground" />
                <span className="text-xl font-semibold">{data.epicId}</span>
              </div>
              <Form action="/dashboard" method="post">
                <input type="hidden" name="action" value="unlink" />
                <Button type="submit" variant="outline">
                  Unlink
                </Button>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

type ProfileData = {
  profile: {
    epicAccountId: string;
    displayName: string;
  };
};

type ActionResponse =
  | { ok: true; profile?: ProfileData; linked?: boolean }
  | { ok: false; error: string };

function MultistepLinkAccount() {
  const data = useActionData<ActionResponse>();
  const [step, setStep] = useState(1);
  const [id, setId] = useState<string>('');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkingStatus, setLinkingStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!data) return;

    if (data.ok && data.profile) {
      setId(data.profile.profile.epicAccountId);
      setProfile(data.profile);
      setStep(3);
    } else if (data.ok && data.linked) {
      setSubmitting(false);
      setLinkingStatus('success');
    } else if (!data.ok) {
      setSubmitting(false);
      setLinkingStatus('error');
    }
  }, [data]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Link Epic Games Account</CardTitle>
        <CardDescription>Follow the steps below to link your Epic Games account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {step === 1 && <Step1 onNext={() => setStep(2)} />}

          {step === 2 && <Step2 />}

          {step === 3 && (
            <Step3
              id={id}
              profile={profile}
              submitting={submitting}
              onSubmit={() => setSubmitting(true)}
            />
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-muted-foreground">Step {step} of 3</div>
      </CardFooter>
    </Card>
  );
}

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Step 1: Find your Epic Games profile link</h3>
      <p>
        To link your Epic Games account, you'll need to provide your profile link. Here's how to
        find it:
      </p>
      <ol className="list-decimal list-inside space-y-2">
        <li>Go to the Epic Games website and log in to your account</li>
        <li>
          Open{' '}
          <Link
            to="https://store.epicgames.com/u"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500"
          >
            https://store.epicgames.com/u
          </Link>
        </li>
        <li>
          Copy the URL of the page or click on the three dots next to the privacy options and click
          on "Copy Link to Share".
        </li>
      </ol>
      <Button onClick={onNext} className="mt-4">
        Next: Enter Profile Link
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function Step2() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Step 2: Enter your Epic Games profile link</h3>
      <Form action="/dashboard" method="post" className="flex flex-col gap-3">
        <input type="hidden" name="action" value="check" />
        <div className="space-y-2">
          <Label htmlFor="profileLink">Epic Games Profile Link</Label>
          <Input
            id="profileLink"
            name="url"
            placeholder="https://store.epicgames.com/u/your-epic-id"
            required
          />
        </div>
        <div className="flex flex-row justify-between gap-4">
          <Button type="submit" className="w-full">
            Check Profile
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              navigator.clipboard.readText().then((text) => {
                document.querySelector<HTMLInputElement>('#profileLink')!.value = text;
              });
            }}
          >
            Paste from Clipboard
          </Button>
        </div>
      </Form>
    </div>
  );
}

function Step3({
  id,
  profile,
  submitting,
  onSubmit,
}: {
  id: string;
  profile: ProfileData | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Step 3: Confirmation</h3>
      <p>
        We found your Epic Games account with the following details. If this is correct, you can
        link your account now.
      </p>
      <Form className="space-y-2" action="/dashboard" method="post" onSubmit={onSubmit}>
        <input type="hidden" name="action" value="link" />
        <Label htmlFor="epicId">Epic ID</Label>
        <Input id="epicId" name="epicId" value={id} readOnly />
        <Label htmlFor="name">Display Name</Label>
        <Input id="name" value={profile?.profile.displayName ?? ''} readOnly />
        <Button type="submit" disabled={submitting}>
          {submitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? 'Linking Account...' : 'Link Account'}
        </Button>
      </Form>
    </div>
  );
}
