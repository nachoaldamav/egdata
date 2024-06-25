import { LayersIcon } from '@radix-ui/react-icons';
import { type LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Link, Outlet, useLoaderData, useMatches } from '@remix-run/react';
import { cn } from '~/lib/utils';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const lastPath = request.url.split('/').pop();

  if (lastPath === params.id) {
    return redirect(`/sandboxes/${params.id}/offers`);
  }

  return { lastPath, id: params.id };
}

export default function Index() {
  const { lastPath, id } = useLoaderData<typeof loader>();
  const matches = useMatches();

  const clientId = matches[matches.length - 1].params.id;
  const clientPath = matches[matches.length - 1].pathname.split('/').pop();

  return (
    <div className="flex min-h-[75vh] w-full">
      <div className="hidden border-r lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex-1 overflow-auto py-2 min-w-[200px]">
            <nav className="grid items-start px-4 text-sm font-medium">
              <NavItem
                currentPath={clientPath || (lastPath as string)}
                name="offers"
                id={clientId || (id as string)}
              >
                <LayoutGridIcon className="h-4 w-4" />
                Offers
              </NavItem>
              <NavItem
                currentPath={clientPath || (lastPath as string)}
                name="items"
                id={clientId || (id as string)}
              >
                <PackageIcon className="h-4 w-4" />
                Items
              </NavItem>
              <NavItem
                currentPath={clientPath || (lastPath as string)}
                name="assets"
                id={clientId || (id as string)}
              >
                <LayersIcon className="h-4 w-4" />
                Assets
              </NavItem>
              {/* <NavItem
                currentPath={clientPath || (lastPath as string)}
                name="sandbox"
                id={clientId || (id as string)}
              >
                <FolderIcon className="h-4 w-4" />
                Sandbox
              </NavItem> */}
            </nav>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

function NavItem({
  currentPath,
  name,
  children,
  id,
}: {
  currentPath: string;
  name: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <Link
      to={`/sandboxes/${id}/${name}`}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        currentPath === name && 'text-primary bg-muted',
      )}
    >
      {children}
    </Link>
  );
}

function FolderIcon(props) {
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
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function LayoutGridIcon(props) {
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
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function PackageIcon(props) {
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
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
