import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import type { LinksFunction } from '@remix-run/node';
import stylesheet from '~/tailwind.css?url';
import Navbar from '~/components/app/navbar';
import { SearchProvider } from '~/context/global-search';
import { CountryProvider } from '~/context/country';

export const links: LinksFunction = () => [
  { rel: 'preload', href: stylesheet, as: 'style' },
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'preconnect', href: 'https://cdn1.epicgames.com/' },
  { rel: 'preconnect', href: 'https://api.egdata.app/' },
];

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
        <SearchProvider>
          <CountryProvider>
            <Navbar />
            {children}
            <ScrollRestoration />
            <Scripts />
            <footer className="flex flex-col items-center justify-center p-4 text-gray-500 dark:text-gray-400 text-xs">
              <p>
                egdata.app is a fan-made website and is not affiliated by any
                means with Epic Games, Inc.
              </p>
              <p>
                All the logos, images, trademarks and creatives are property of
                their respective owners.
              </p>
            </footer>
          </CountryProvider>
        </SearchProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
