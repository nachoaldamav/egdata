import { createRootRouteWithContext, Link } from '@tanstack/react-router';
import { Outlet, ScrollRestoration } from '@tanstack/react-router';
import { Meta, Scripts } from '@tanstack/start';
import type * as React from 'react';
import styles from '../styles.css?url';
import defaultPlayerTheme from '@vidstack/react/player/styles/default/theme.css?url';
import defaultAudioPlayer from '@vidstack/react/player/styles/default/layouts/audio.css?url';
import defaultVideoPlayer from '@vidstack/react/player/styles/default/layouts/video.css?url';
import Navbar from '@/components/app/navbar';
import type { QueryClient } from '@tanstack/react-query';
import { CountryProvider } from '@/providers/country';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import getCountryCode from '@/lib/get-country-code';
import { parseCookieString } from '@/lib/parse-cookies';
import { decodeJwt, saveAuthCookie } from '@/lib/cookies';
import { SearchProvider } from '@/providers/global-search';
import { getUserInformation } from '@/queries/profiles';
import { PreferencesProvider } from '@/providers/preferences';
import { CompareProvider } from '@/providers/compare';
import { ComparisonPortal } from '@/components/app/comparison-portal';
import { LocaleProvider } from '@/providers/locale';
import consola from 'consola';
import { CookiesProvider } from '@/providers/cookies';
import { Base64Utils } from '@/lib/base-64';
import type { EpicToken } from '@/types/epic';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  cookies: Record<string, string>;
  epicToken: EpicToken | null;
  country: string;
}>()({
  component: RootComponent,

  loader: async ({ context }) => {
    let url: URL;
    let cookieHeader: string;

    if (import.meta.env.SSR) {
      const { getWebRequest } = await import('vinxi/http');
      const request = getWebRequest();
      url = new URL(request.url);
      cookieHeader = request.headers.get('Cookie') ?? '';
    } else {
      url = new URL(window.location.href);
      cookieHeader = document.cookie;
    }

    if (typeof cookieHeader !== 'string') {
      cookieHeader = '';
    }

    const { cookies } = context;

    const country = getCountryCode(url, cookies);
    const locale = cookies.user_locale;
    const timezone = cookies.user_timezone;
    const analyticsCookies = cookies.EGDATA_COOKIES
      ? JSON.parse(Base64Utils.decode(cookies.EGDATA_COOKIES))
      : null;

    return {
      country,
      locale,
      timezone,
      analyticsCookies,
    };
  },

  beforeLoad: async ({ cause, context }) => {
    const { queryClient } = context;
    let url: URL;
    let cookieHeader: string;

    if (import.meta.env.SSR) {
      const { getWebRequest } = await import('vinxi/http');
      const request = getWebRequest();
      url = new URL(request.url);
      cookieHeader = request.headers.get('Cookie') ?? '';
    } else {
      url = new URL(window.location.href);
      cookieHeader = document.cookie;
    }

    if (typeof cookieHeader !== 'string') {
      cookieHeader = '';
    }

    const parsedCookies = parseCookieString(cookieHeader);
    const cookies = Object.fromEntries(
      Object.entries(parsedCookies).map(([key, value]) => [key, value || '']),
    );
    const country = getCountryCode(url, cookies);

    const authCookie = cookies.EGDATA_AUTH;
    let epicToken = authCookie ? await decodeJwt({ data: authCookie }) : null;

    // Refresh the token if it's expired or about to expire (within 10 minutes)
    if (cause !== 'preload' && epicToken) {
      if (
        epicToken &&
        new Date(epicToken.expires_at).getTime() <
          new Date().getTime() + 10 * 60 * 1000
      ) {
        const refreshResponse = await fetch(
          'https://api.egdata.app/auth/v2/refresh',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${authCookie}`,
            },
          },
        );

        if (refreshResponse.ok) {
          const refreshData = (await refreshResponse.json()) as {
            accessToken: string;
            refreshToken: string;
            expiresAt: string;
            refreshExpiresAt: string;
          };

          epicToken = {
            access_token: refreshData.accessToken,
            refresh_token: refreshData.refreshToken ?? epicToken.refresh_token,
            expires_at: refreshData.expiresAt ?? epicToken.expires_at,
            refresh_expires_at:
              refreshData.refreshExpiresAt ?? epicToken.refresh_expires_at,
            account_id: epicToken.account_id,
            application_id: epicToken.application_id,
            scope: epicToken.scope,
            token_type: epicToken.token_type,
            client_id: epicToken.client_id,
            expires_in: epicToken.expires_in,
            refresh_expires_in: epicToken.refresh_expires_in,
          };

          await saveAuthCookie({
            data: JSON.stringify({ name: 'EGDATA_AUTH', value: epicToken }),
          });

          consola.log('Refreshed token', epicToken.account_id);
        } else {
          consola.error(
            'Failed to refresh token',
            await refreshResponse.json(),
          );
        }
      }

      const isExpired = epicToken
        ? new Date(epicToken.expires_at).getTime() < Date.now()
        : false;

      if (epicToken && isExpired) {
        if (import.meta.env.SSR) {
          const { deleteCookie } = await import('vinxi/http');
          deleteCookie('EGDATA_AUTH', {
            secure: true,
            path: '/',
            domain: import.meta.env.PROD ? '.egdata.app' : 'localhost',
          });
        }
      }

      if (epicToken && !isExpired) {
        await queryClient.prefetchQuery({
          queryKey: ['user', { id: epicToken?.account_id }],
          queryFn: () => getUserInformation(epicToken?.account_id || null),
        });
      }
    }

    return {
      country,
      cookies,
      url,
      epicToken,
    };
  },

  notFoundComponent() {
    return <NotFoundPage />;
  },

  head: () => {
    return {
      links: [
        {
          rel: 'stylesheet',
          href: styles,
          preload: 'true',
        },
        { rel: 'preconnect', href: 'https://cdn1.epicgames.com/' },
        { rel: 'preconnect', href: 'https://api.egdata.app/' },
        { rel: 'preconnect', href: 'https://cdn.egdata.app/' },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'manifest',
          href: '/site.webmanifest',
        },
        {
          rel: 'mask-icon',
          href: '/safari-pinned-tab.svg',
          color: '#5bbad5',
        },
        {
          rel: 'preload',
          href: 'https://cdn.egdata.app/Nunito/Nunito-VariableFont_wght.ttf',
          as: 'font',
          type: 'font/ttf',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'preload',
          href: 'https://cdn.egdata.app/Nunito/Nunito-Italic-VariableFont_wght.ttf',
          as: 'font',
          type: 'font/ttf',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'preload',
          href: 'https://cdn.egdata.app/Montserrat/Montserrat-VariableFont_wght.ttf',
          as: 'font',
          type: 'font/ttf',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'stylesheet',
          href: defaultPlayerTheme,
        },
        {
          rel: 'stylesheet',
          href: defaultAudioPlayer,
        },
        {
          rel: 'stylesheet',
          href: defaultVideoPlayer,
        },
      ],
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title: 'Epic Games Database - egdata.app',
        },
        {
          name: 'description',
          content:
            'Comprehensive Epic Games Store database: game info, prices, sales history, file lists, and more. Explore free games, upcoming releases, and community insights.',
        },
        {
          name: 'keywords',
          content: [
            'Epic Games Store',
            'EGS',
            'Epic Games Database',
            'EGS Database',
            'game prices',
            'game sales',
            'discounts',
            'player count',
            'game size',
            'system requirements',
            'release date',
            'free games',
            'upcoming releases',
            'game files',
            'file list',
            'game assets',
            'historical data',
            'price tracker',
            'EGS tracker',
            'PC games',
            'data mining',
            'Epic Games API',
            'egdata',
            'egstore',
            'eos',
          ].join(', '),
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:site',
          content: '@egdataapp',
        },
        {
          name: 'twitter:title',
          content: 'Epic Games Database',
        },
        {
          name: 'twitter:description',
          content:
            'A free and open-source Epic Games Store database with comprehensive game information, sales tracking, and more. Community-driven and constantly updated.', // Improved description
        },
        {
          name: 'twitter:image',
          content: 'https://cdn.egdata.app/placeholder-1080.webp',
        },
        {
          name: 'twitter:image:alt',
          content: 'Epic Games Database',
        },
        {
          name: 'og:title',
          content: 'Epic Games Database',
        },
        {
          name: 'og:type',
          content: 'website',
        },
        {
          name: 'og:url',
          content: 'https://egdata.app',
        },
        {
          name: 'og:image',
          content: 'https://cdn.egdata.app/placeholder-1080.webp',
        },
        {
          name: 'og:image:alt',
          content: 'Epic Games Database',
        },
        {
          name: 'og:description',
          content:
            'A free and open-source Epic Games Store database with comprehensive game information, sales tracking, and more. Community-driven and constantly updated.', // Improved description
        },
      ],
      scripts: [
        {
          src: 'https://analytics.egdata.app/script.js',
          async: true,
          'data-website-id': import.meta.env.PROD
            ? '931f85f9-f8b6-422c-882d-04864194435b'
            : undefined,
        },
        // Append the service worker registration script to the end of the body
        {
          src: '/register-sw.js',
        },
      ],
    };
  },
});

function NotFoundPage() {
  return (
    <div className="w-full h-full flex flex-col items-start justify-center">
      <h2>Page not found</h2>
    </div>
  );
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
  const { country, locale, timezone, analyticsCookies } = Route.useLoaderData();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Meta />
      </head>
      <body className="antialiased">
        <div
          className="md:container mx-auto overflow-x-hidden"
          suppressHydrationWarning={true}
        >
          <LocaleProvider initialLocale={locale} initialTimezone={timezone}>
            <CountryProvider defaultCountry={country}>
              <CompareProvider>
                <SearchProvider>
                  <Navbar />
                  <PreferencesProvider>
                    <CookiesProvider initialSelection={analyticsCookies}>
                      {children}
                    </CookiesProvider>
                  </PreferencesProvider>
                  <ComparisonPortal />
                  <footer className="flex flex-col items-center justify-center p-4 text-gray-500 dark:text-gray-400 text-xs gap-1">
                    <p>
                      egdata.app is a fan-made website and is not affiliated by
                      any means with Epic Games, Inc.
                    </p>
                    <p>
                      All the logos, images, trademarks and creatives are
                      property of their respective owners.
                    </p>
                    <hr className="w-1/3 my-2 border-gray-300/40" />
                    <div className="inline-flex gap-2">
                      <span>
                        Countries flags by{' '}
                        <a
                          href="https://flagpedia.net"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <strong>Flagpedia</strong>
                        </a>
                      </span>
                      <span>|</span>
                      <span className="inline-flex gap-1 items-center">
                        Made in{' '}
                        <img
                          src="https://flagcdn.com/16x12/eu.webp"
                          alt="EU Flag"
                        />
                      </span>
                      <span>|</span>
                      <Link to="/privacy">Privacy Policy</Link>
                    </div>
                  </footer>
                </SearchProvider>
              </CompareProvider>
            </CountryProvider>
          </LocaleProvider>
        </div>

        {import.meta.env.DEV && (
          <TanStackRouterDevtools position="bottom-left" />
        )}
        <ReactQueryDevtools buttonPosition="bottom-right" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
