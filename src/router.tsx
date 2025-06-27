import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { routeTree } from './routeTree.gen';
import { DefaultCatchBoundary } from '@/components/app/default-catch-boundary';
import { NotFound } from '@/components/app/not-found';
import { getQueryClient } from '@/lib/client';

export function createRouter() {
  const queryClient = getQueryClient();

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      // @ts-expect-error
      context: { queryClient },
      defaultPreload: 'intent',
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
      scrollRestoration: true,
      defaultViewTransition: {
        types: ({ fromLocation, toLocation }) => {
          let direction = 'none';

          if (fromLocation) {
            const fromIndex = fromLocation.state.__TSR_index;
            const toIndex = toLocation.state.__TSR_index;

            direction = fromIndex > toIndex ? 'right' : 'left';
          }

          console.log(direction);

          return [`slide-${direction}`];
        },
      },
    }),
    queryClient,
  );
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
