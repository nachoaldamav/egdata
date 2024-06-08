import { useRef, useEffect } from 'react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
} from '~/components/ui/sheet';
import { Button } from '~/components/ui/button';
import { Link } from '@remix-run/react';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '~/components/ui/navigation-menu';
import { Input } from '~/components/ui/input';
import { useSearch } from '~/hooks/use-search';

const routes = [
  {
    name: 'Games',
    href: '#',
  },
  {
    name: 'Genres',
    href: '#',
  },
  {
    name: 'Platforms',
    href: '#',
  },
  {
    name: 'About',
    href: '#',
  },
];

export default function Navbar() {
  const { query, setQuery, setFocus, inputRef } = useSearch();

  return (
    <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6">
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
              <GamepadIcon className="h-6 w-6" />
              <span className="sr-only">GameDB</span>
            </Link>
          </SheetHeader>
          <div className="grid gap-2 py-6">
            {routes.map((route) => (
              <Link key={route.name} to={route.href}>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  {route.name}
                </NavigationMenuLink>
              </Link>
            ))}
          </div>
          <SheetFooter>
            <form className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search games..."
                  className="pl-8 w-full"
                />
              </div>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Link to="/" className="mr-6 hidden lg:flex">
        <GamepadIcon className="h-6 w-6" />
        <span className="sr-only">GameDB</span>
      </Link>
      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          {routes.map((route) => (
            <Link key={route.name} to={route.href}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {route.name}
              </NavigationMenuLink>
            </Link>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      <div className="ml-auto flex items-center gap-4">
        <form className="flex-1 ml-auto sm:flex-initial">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Search games..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              ref={inputRef}
            />
          </div>
        </form>
      </div>
    </header>
  );
}

function GamepadIcon(props) {
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
      <line x1="6" x2="10" y1="12" y2="12" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" />
      <line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}

function MenuIcon(props) {
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

function SearchIcon(props) {
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
