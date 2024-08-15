import { Sheet, SheetTrigger, SheetContent, SheetHeader } from '~/components/ui/sheet';
import { Button } from '~/components/ui/button';
import { Link, useNavigate } from '@remix-run/react';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '~/components/ui/navigation-menu';
import { Input } from '~/components/ui/input';
import { useSearch } from '~/hooks/use-search';
import { CountriesSelector } from './country-selector';
import { useEffect } from 'react';
import { useAuth } from '~/hooks/use-auth';

const routes = [
  {
    name: 'Search',
    href: '/search',
  },
  {
    name: 'Genres',
    href: '/genres',
  },
  {
    name: 'Sales',
    href: '/sales',
  },
  {
    name: 'Changelog',
    href: '/changelog',
  },
];

export default function Navbar() {
  const { setFocus, focus } = useSearch();
  const { account } = useAuth();

  useEffect(() => {
    // If the user uses "CMD + K" or "CTRL + K" to focus the search input
    // we should set the focus to true
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (focus === false) {
          setFocus(true);
        } else {
          setFocus(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setFocus, focus]);

  return (
    <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6 gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <Link to="/" className="mr-6 flex items-center gap-2">
              <img src="/logo_simple_white.png" alt="GameDB Logo" width={40} height={40} />
              <span className="text-xl text-white font-montserrat font-bold">EGDATA</span>
            </Link>
          </SheetHeader>
          <NavigationMenu className="grid gap-2 py-6">
            {routes.map((route) => (
              <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild key={route.name}>
                <Link to={route.href}>{route.name}</Link>
              </NavigationMenuLink>
            ))}
          </NavigationMenu>
        </SheetContent>
      </Sheet>
      <Link to="/" className="hidden lg:flex justify-center items-center" prefetch="render">
        <img src="/logo_simple_white.png" alt="EGDATA Logo" width={40} height={40} />
        <span className="text-xl text-white font-montserrat ml-2 font-bold">EGDATA</span>
      </Link>
      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          {routes.map((route) => (
            <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild key={route.name}>
              <Link key={route.name} to={route.href} prefetch="render">
                {route.name}
              </Link>
            </NavigationMenuLink>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      <div className="ml-auto flex items-center gap-4">
        <div
          className="relative cursor-text"
          onClick={() => setFocus(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setFocus(true);
            }
          }}
        >
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search games..."
            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] cursor-text"
            onFocus={() => setFocus(true)}
            readOnly
          />
        </div>
      </div>
      <CountriesSelector />
      {account && (
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-montserrat">{account.displayName}</span>
        </div>
      )}
    </header>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
