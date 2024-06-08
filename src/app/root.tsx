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

export const links: LinksFunction = () => [
  { rel: 'preload', href: stylesheet, as: 'style' },
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'preconnect', href: 'https://cdn.egdata.app/' },
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
          <Navbar />
          {children}
          <ScrollRestoration />
          <Scripts />
        </SearchProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
