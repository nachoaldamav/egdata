import {
  json,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import cookie from 'cookie';
import Navbar from '~/components/app/navbar';
import { SearchProvider } from '~/context/global-search';
import { CountryProvider } from '~/context/country';
import { CookiesProvider } from '~/context/cookies';
import stylesheet from '../tailwind.css?url';
import { queryClient } from '~/lib/client';
import { type Preferences, PreferencesProvider } from '~/context/preferences';
import { decode } from '~/lib/preferences-encoding';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'preconnect', href: 'https://cdn1.epicgames.com/' },
  { rel: 'preconnect', href: 'https://api.egdata.app/' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com/' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com/', crossOrigin: 'anonymous' },
  // Load nunito sans and Montserrat from google fonts
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap',
  },
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
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie');
  const cookies = cookie.parse(cookieHeader || '');
  const userPreferences = (
    cookies.EGDATA_PREFERENCES ? JSON.parse(decode(cookies.EGDATA_PREFERENCES)) : undefined
  ) as Preferences;

  return json({ userPreferences });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { userPreferences } = useLoaderData<typeof loader>();
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased">
        <div className="container mx-auto">
          <QueryClientProvider client={queryClient}>
            <SearchProvider>
              <CountryProvider>
                <Navbar />
                <CookiesProvider>
                  <PreferencesProvider initialPreferences={userPreferences}>
                    {children}
                  </PreferencesProvider>
                </CookiesProvider>
                <ScrollRestoration />
                <Scripts />
                <footer className="flex flex-col items-center justify-center p-4 text-gray-500 dark:text-gray-400 text-xs gap-1">
                  <p>
                    egdata.app is a fan-made website and is not affiliated by any means with Epic
                    Games, Inc.
                  </p>
                  <p>
                    All the logos, images, trademarks and creatives are property of their respective
                    owners.
                  </p>
                  <hr className="w-1/3 my-2 border-gray-300/40" />
                  <div className="inline-flex gap-2">
                    <span>
                      Countries flags by{' '}
                      <Link to="https://flagpedia.net" target="_blank" rel="noopener noreferrer">
                        <strong>Flagpedia</strong>
                      </Link>
                    </span>
                    <span>|</span>
                    <span className="inline-flex gap-1 items-center">
                      Made in <img src="https://flagcdn.com/16x12/eu.webp" alt="EU Flag" />
                    </span>
                  </div>
                </footer>
                <ReactQueryDevtools initialIsOpen={false} />
              </CountryProvider>
            </SearchProvider>
          </QueryClientProvider>
        </div>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
