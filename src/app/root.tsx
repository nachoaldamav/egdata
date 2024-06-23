import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import type { LinksFunction } from '@remix-run/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import stylesheet from '~/tailwind.css?url';
import Navbar from '~/components/app/navbar';
import { SearchProvider } from '~/context/global-search';
import { CountryProvider } from '~/context/country';
import { CookiesProvider } from '~/context/cookies';
import '../tailwind.css';
// import '../fonts.css';

export const links: LinksFunction = () => [
  { rel: 'preload', href: stylesheet, as: 'style' },
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

const queryClient = new QueryClient();

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="container antialiased">
        <QueryClientProvider client={queryClient}>
          <SearchProvider>
            <CountryProvider>
              <Navbar />
              <CookiesProvider>{children}</CookiesProvider>
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
            </CountryProvider>
          </SearchProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
