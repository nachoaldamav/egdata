import { getQueryClient } from '@/lib/client';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { httpClient } from '@/lib/http-client';
import { type Collections, getCollection } from '@/queries/collection';
import { dehydrate } from '@tanstack/react-query';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/collections/$id/$week')({
  component: RouteComponent,

  beforeLoad: async ({ params, context }) => {
    const { id, week } = params;
    const { queryClient, country } = context;

    await queryClient.prefetchInfiniteQuery({
      queryKey: [
        'collection',
        {
          id,
          country,
          limit: 20,
          week,
        },
      ],
      queryFn: ({ pageParam }) =>
        getCollection({
          slug: id,
          limit: 20,
          page: pageParam as number,
          country,
          week,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage: Collections, allPages: Collections[]) => {
        if (lastPage.page * lastPage.limit + 20 > lastPage.total) {
          return undefined;
        }

        return allPages?.length + 1;
      },
    });

    const ogData = await httpClient.get<{
      id: string;
      url: string;
    }>(`/collections/${id}/${week}/og`, {
      timeout: 1000 * 60 * 60 * 24, // 24 hours
    });

    return {
      id,
      dehydratedState: dehydrate(queryClient),
      country,
      og: ogData.url,
    };
  },

  head: (ctx) => {
    const { params, match } = ctx;
    const queryClient = getQueryClient();

    if (!match.context.og) {
      console.log('No loader data', Object.keys(ctx));
      return {
        meta: [
          {
            title: 'Collection not found',
            description: 'Collection not found',
          },
        ],
      };
    }

    const { og } = match.context;

    const collectionPages = getFetchedQuery<{
      pages: Collections[];
    }>(queryClient, match.context.dehydratedState, [
      'collection',
      {
        id: params.id,
        country: match.context.country,
        limit: 20,
        week: params.week,
      },
    ]);

    const collection = collectionPages?.pages[0];

    if (!collection) {
      return {
        meta: [
          {
            title: 'Collection not found',
            description: 'Collection not found',
          },
        ],
      };
    }

    return {
      meta: [
        {
          title: `${collection.title} | egdata.app`,
        },
        {
          name: 'description',
          content: `Check out the ${collection.title} from the Epic Games Store.`,
        },
        {
          name: 'og:title',
          content: `${collection.title} | egdata.app`,
        },
        {
          name: 'og:description',
          content: `Check out the ${collection.title} from the Epic Games Store.`,
        },
        {
          property: 'twitter:title',
          content: `${collection.title} | egdata.app`,
        },
        {
          property: 'twitter:description',
          content: `Check out the ${collection.title} from the Epic Games Store.`,
        },
        {
          name: 'og:image',
          content: og,
        },
        {
          name: 'og:type',
          content: 'website',
        },
      ],
    };
  },
});

function RouteComponent() {
  return <Outlet />;
}
