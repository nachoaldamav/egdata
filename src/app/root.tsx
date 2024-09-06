import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from '@remix-run/react';
import {
  type LinksFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
} from '@remix-run/node';
import { dehydrate, HydrationBoundary, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import cookie from 'cookie';
import Navbar from '~/components/app/navbar';
import { SearchProvider } from '~/context/global-search';
import { CountryProvider } from '~/context/country';
import { CookiesProvider } from '~/context/cookies';
import { CompareProvider } from '~/providers/compare';
import { ComparisonPortal } from '~/components/app/comparison-portal';
import { getQueryClient } from '~/lib/client';
import { type Preferences, PreferencesProvider } from '~/context/preferences';
import { decode } from '~/lib/preferences-encoding';
import getCountryCode from '~/lib/get-country-code';
import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import BugsnagPerformance from '@bugsnag/browser-performance';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { IoAlertCircle } from 'react-icons/io5';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Button } from '~/components/ui/button';
import { epic } from './cookies.server';
import { AuthProvider } from '~/providers/auth';
import { authenticator } from './services/auth.server';
import type { EpicAccountResponse } from '~/lib/get-epic-account.server';
import { httpClient } from '~/lib/http-client';
import tailwindCss from '../tailwind.css?url';
import fontCss from '../fonts.css?url';
import '../tailwind.css';
import '../fonts.css';
import { getSession, sessionStorage } from './sessions.server';

if (!import.meta.env.SSR) {
  Bugsnag.start({
    apiKey: '5f4462bdefb8d9b6a281d664d667004e',
    plugins: [new BugsnagPluginReact()],
  });
  BugsnagPerformance.start({ apiKey: '5f4462bdefb8d9b6a281d664d667004e' });
} else {
  Bugsnag.start({ apiKey: '04cf12758cb83aa44a33701b509c01b8' });
}

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://cdn1.epicgames.com/' },
  { rel: 'preconnect', href: 'https://api.egdata.app/' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com/' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com/', crossOrigin: 'anonymous' },
  ...(import.meta.env.DEV
    ? [
        { rel: 'stylesheet', href: tailwindCss, preload: 'true' },
        { rel: 'stylesheet', href: fontCss, preload: 'true' },
      ]
    : []),
];

export const meta: MetaFunction = () => {
  return [
    { title: 'egdata.app' },
    {
      name: 'description',
      content:
        'Epic Games database with all the information you need about the games, items, and events.',
    },
    {
      name: 'keywords',
      content:
        'epic games, fortnite, database, api, epic games api, egdata, epic games store, egstore, epic online services, eos',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: 'https://egdata.app',
    },
    {
      tagName: 'link',
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon.png',
    },
    {
      tagName: 'link',
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicon-32x32.png',
    },
    {
      tagName: 'link',
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/favicon-16x16.png',
    },
    {
      tagName: 'link',
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const queryClient = getQueryClient();
  try {
    let cookieHeader = request.headers.get('Cookie');
    if (typeof cookieHeader !== 'string') {
      cookieHeader = '';
    }
    const cookies = cookie.parse(cookieHeader || '');
    const userPreferences = (
      cookies.EGDATA_PREFERENCES ? JSON.parse(decode(cookies.EGDATA_PREFERENCES)) : undefined
    ) as Preferences;
    const authCookie = await epic.parse(cookieHeader);
    const url = new URL(request.url);
    const country = getCountryCode(url, cookies);

    const authenticatedUser = await authenticator.isAuthenticated(request);
    const session = await getSession(request.headers.get('cookie'));

    const isPrefetch = request.headers.get('purpose') === 'prefetch';

    if (authenticatedUser && !isPrefetch) {
      if (
        !authenticatedUser.accountId ||
        !authenticatedUser.expires_at ||
        !authenticatedUser.tokenId
      ) {
        return redirect('/logout');
      }

      const forceRefresh = url.searchParams.get('forceRefresh') === 'true';

      // If the token is expired, we can retrieve it from the DB as it's refreshed there
      if (new Date(authenticatedUser.expires_at).getTime() < Date.now() || forceRefresh) {
        console.log(`Token ${authenticatedUser.tokenId} expired, refreshing 🔁`);
        const tokens = await httpClient
          .get<{
            accessToken: string;
            refreshToken: string;
            expiresAt: string;
          }>('/auth/refresh', {
            params: {
              id: authenticatedUser.tokenId,
            },
            headers: {
              Authorization: `Bearer ${authenticatedUser.accessToken}`,
            },
            retries: 0,
          })
          .catch(() => null);

        if (!tokens) {
          console.log(`Token ${authenticatedUser.tokenId} expired, but couldn't refresh`);
          return redirect('/logout', {
            headers: {
              'Set-Cookie': await sessionStorage.destroySession(session),
            },
          });
        }

        console.log(`Token ${authenticatedUser.tokenId} refreshed 🚀`);

        session.set(authenticator.sessionKey, {
          ...authenticatedUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expires_at: tokens.expiresAt,
        });

        const cookieHeader = await sessionStorage.commitSession(session, {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        });

        const target = url.pathname + url.search;

        console.log(`Redirecting to ${target}`);

        return redirect(forceRefresh ? '/' : target, {
          headers: {
            'Set-Cookie': cookieHeader,
          },
        });
      }

      console.log(
        `Token ${authenticatedUser.tokenId} still valid, expiring at ${new Date(
          authenticatedUser.expires_at,
        ).toLocaleString()}`,
      );

      const profile = await queryClient.fetchQuery({
        queryKey: ['epic-account', authenticatedUser.accountId],
        queryFn: async () => {
          const dbUser = await httpClient.get<EpicAccountResponse['0']>('/auth', {
            retries: 0,
            headers: {
              Authorization: `Bearer ${authenticatedUser.accessToken}`,
            },
          });
          return dbUser;
        },
        staleTime: 10_000,
      });

      authenticatedUser.profile = profile;
    }

    return {
      userPreferences,
      country,
      authCookie,
      dehydratedState: dehydrate(queryClient),
      authenticatedUser,
    };
  } catch (error) {
    console.error(error);
    return {
      userPreferences: {} as Preferences,
      country: 'US',
      authCookie: null,
      dehydratedState: null,
      authenticatedUser: null,
    };
  }
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    Bugsnag.notify({
      errorMessage: error.statusText,
      errorClass: error.status.toString(),
      message: error.data,
    });
    return (
      <Alert variant="destructive">
        <IoAlertCircle className="h-4 w-4" />
        <AlertTitle>
          {error.status} {error.statusText}
        </AlertTitle>
        <AlertDescription>{error.data}</AlertDescription>
      </Alert>
    );
  }

  if (error instanceof Error) {
    Bugsnag.notify(error);

    return (
      <Alert variant="destructive">
        <IoAlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-medium">View stack trace</summary>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4 mt-2">
            <pre className="text-xs">{error.stack}</pre>
          </ScrollArea>
        </details>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <IoAlertCircle className="h-4 w-4" />
      <AlertTitle>Unknown Error</AlertTitle>
      <AlertDescription>An unexpected error occurred. Please try again later.</AlertDescription>
    </Alert>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const { userPreferences, country, dehydratedState, authenticatedUser } =
    useLoaderData<typeof loader>() || {};

  if (authenticatedUser?.profile && typeof window !== 'undefined') {
    window?.umami?.identify({
      authenticated: true,
    });
  }

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased">
        <div className="md:container mx-auto overflow-x-hidden">
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={dehydratedState}>
              <CountryProvider defaultCountry={country || 'US'}>
                <CompareProvider>
                  <SearchProvider>
                    <AuthProvider user={authenticatedUser}>
                      <Navbar />
                      <CookiesProvider>
                        <PreferencesProvider initialPreferences={userPreferences}>
                          {children}
                        </PreferencesProvider>
                      </CookiesProvider>
                      <ScrollRestoration />
                      <Scripts />
                      <ComparisonPortal />
                      <footer className="flex flex-col items-center justify-center p-4 text-gray-500 dark:text-gray-400 text-xs gap-1">
                        <p>
                          egdata.app is a fan-made website and is not affiliated by any means with
                          Epic Games, Inc.
                        </p>
                        <p>
                          All the logos, images, trademarks and creatives are property of their
                          respective owners.
                        </p>
                        <hr className="w-1/3 my-2 border-gray-300/40" />
                        <div className="inline-flex gap-2">
                          <span>
                            Countries flags by{' '}
                            <Link
                              to="https://flagpedia.net"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <strong>Flagpedia</strong>
                            </Link>
                          </span>
                          <span>|</span>
                          <span className="inline-flex gap-1 items-center">
                            Made in <img src="https://flagcdn.com/16x12/eu.webp" alt="EU Flag" />
                          </span>
                          <span>|</span>
                          <Link to="/privacy">Privacy Policy</Link>
                        </div>
                      </footer>
                      <ReactQueryDevtools initialIsOpen={false} />
                    </AuthProvider>
                  </SearchProvider>
                </CompareProvider>
              </CountryProvider>
            </HydrationBoundary>
          </QueryClientProvider>
        </div>
      </body>
    </html>
  );
}

function App() {
  return <Outlet />;
}

export default App;
