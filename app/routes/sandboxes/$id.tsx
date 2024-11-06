import { httpClient } from '@/lib/http-client';
import type { SingleSandbox } from '@/types/single-sandbox';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { SectionsNav } from '@/components/app/offer-sections';
import {
  Archive,
  BoxIcon,
  Library,
  LibraryIcon,
  LibrarySquareIcon,
  PackageIcon,
  StoreIcon,
} from 'lucide-react';
import type { SingleOffer } from '@/types/single-offer';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { getQueryClient } from '@/lib/client';
import { EpicTrophyIcon } from '@/components/icons/epic-trophy';
import { getImage } from '@/lib/get-image';
import { generateSandboxMeta } from '@/lib/generate-sandbox-meta';

export const Route = createFileRoute('/sandboxes/$id')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <SandboxPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ context, params }) => {
    const { queryClient } = context;
    const { id } = params;

    return {
      id,
      dehydratedState: dehydrate(queryClient),
    };
  },

  beforeLoad: async ({ context, params }) => {
    const { id } = params;
    const { queryClient } = context;

    await Promise.all([
      await queryClient.prefetchQuery({
        queryKey: ['sandbox', { id }],
        queryFn: () => httpClient.get<SingleSandbox>(`/sandboxes/${id}`),
      }),
      await queryClient.prefetchQuery({
        queryKey: ['sandbox', 'base-game', { id }],
        queryFn: () =>
          httpClient.get<SingleOffer>(`/sandboxes/${id}/base-game`),
      }),
    ]);

    return {
      id,
      dehydratedState: dehydrate(queryClient),
    };
  },

  meta({ params, loaderData }) {
    const queryClient = getQueryClient();
    const { dehydratedState } = loaderData;
    const { id } = params;

    const sandbox = getFetchedQuery<SingleSandbox>(
      queryClient,
      dehydratedState,
      ['sandbox', { id }]
    );

    const offer = getFetchedQuery<SingleOffer>(queryClient, dehydratedState, [
      'sandbox',
      'base-game',
      { id },
    ]);

    if (!sandbox) {
      return [
        {
          title: 'Sandbox not found',
          description: 'Sandbox not found',
        },
      ];
    }

    return generateSandboxMeta(sandbox, offer);
  },
});

function SandboxPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const subPath = useLocation().pathname.split(`/${id}/`)[1];
  const { data: sandbox } = useQuery({
    queryKey: ['sandbox', { id }],
    queryFn: () => httpClient.get<SingleSandbox>(`/sandboxes/${id}`),
  });

  if (!sandbox) {
    return null;
  }

  return (
    <div className="flex flex-row items-start justify-start h-full gap-4 px-4 w-full min-h-[75vh]">
      <aside className="mt-12">
        <SectionsNav
          links={[
            {
              id: '',
              label: (
                <span className="inline-flex items-center gap-2">
                  <BoxIcon className="size-4" />
                  <span>Sandbox</span>
                </span>
              ),
              href: `/sandboxes/${id}`,
            },
            {
              id: 'items',
              label: (
                <span className="inline-flex items-center gap-2">
                  <LibrarySquareIcon className="size-4" />
                  <span>Items</span>
                </span>
              ),
              href: `/sandboxes/${id}/items`,
            },
            {
              id: 'offers',
              label: (
                <span className="inline-flex items-center gap-2">
                  <StoreIcon className="size-4" />
                  <span>Offers</span>
                </span>
              ),
              href: `/sandboxes/${id}/offers`,
            },
            {
              id: 'assets',
              label: (
                <span className="inline-flex items-center gap-2">
                  <Archive className="size-4" />
                  <span>Assets</span>
                </span>
              ),
              href: `/sandboxes/${id}/assets`,
            },
            {
              id: 'builds',
              label: (
                <span className="inline-flex items-center gap-2">
                  <PackageIcon className="size-4" />
                  <span>Builds</span>
                </span>
              ),
              href: `/sandboxes/${id}/builds`,
            },
            {
              id: 'achievements',
              label: (
                <span className="inline-flex items-center gap-2">
                  <EpicTrophyIcon className="size-4" />
                  <span>Achievements</span>
                </span>
              ),
              href: `/sandboxes/${id}/achievements`,
            },
          ]}
          activeSection={subPath ?? ''}
          onSectionChange={(location) => {
            navigate({
              to: `/sandboxes/${id}/${location}`,
              replace: false,
              resetScroll: false,
            });
          }}
          orientation="vertical"
        />
      </aside>
      <Outlet />
    </div>
  );
}
