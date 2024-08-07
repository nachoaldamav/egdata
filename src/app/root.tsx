import {
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
import { getQueryClient } from '~/lib/client';
import { type Preferences, PreferencesProvider } from '~/context/preferences';
import { decode } from '~/lib/preferences-encoding';
import getCountryCode from '~/lib/get-country-code';
import '../tailwind.css';
import '../fonts.css';
import tailwindCss from '../tailwind.css?url';
import fontCss from '../fonts.css?url';
import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import BugsnagPerformance from '@bugsnag/browser-performance';

Bugsnag.start({
  apiKey: '5f4462bdefb8d9b6a281d664d667004e',
  plugins: [new BugsnagPluginReact()],
});
BugsnagPerformance.start({ apiKey: '5f4462bdefb8d9b6a281d664d667004e' });

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
  try {
    let cookieHeader = request.headers.get('Cookie');
    if (typeof cookieHeader !== 'string') {
      cookieHeader = '';
    }
    const cookies = cookie.parse(cookieHeader || '');
    const userPreferences = (
      cookies.EGDATA_PREFERENCES ? JSON.parse(decode(cookies.EGDATA_PREFERENCES)) : undefined
    ) as Preferences;
    const url = new URL(request.url);
    const country = getCountryCode(url, cookies);

    return { userPreferences, country };
  } catch (error) {
    console.error(error);
    return {
      userPreferences: {} as Preferences,
      country: 'US',
    };
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { userPreferences, country } = useLoaderData<typeof loader>() || {};
  const queryClient = getQueryClient();

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
            <CountryProvider defaultCountry={country || 'US'}>
              <SearchProvider>
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
              </SearchProvider>
            </CountryProvider>
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
