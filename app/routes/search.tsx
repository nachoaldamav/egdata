import { httpClient } from '@/lib/http-client';
import type { FullTag } from '@/types/tags';
import { dehydrate } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { zodSearchValidator } from '@tanstack/router-zod-adapter';
import { type TypeOf, z } from 'zod';
import { useForm } from '@tanstack/react-form';
import { SearchProvider } from '@/providers/search';
import { useSearchState } from '@/hooks/use-search-state';
import { SearchForm } from '@/components/app/search-form';
import { SearchFilters } from '@/components/app/search-filters';
import { SearchHeader } from '@/components/app/search-header';

const searchParamsSchema = z.object({
  hash: z.string().optional(),
  tags: z
    .number()
    .or(z.array(z.number()))
    .or(z.array(z.string()))
    .or(z.string())
    .optional(),
  categories: z.string().array().optional(),
  offer_type: z.string().optional(),
  on_sale: z.boolean().optional(),
  price: z.string().optional(),
  sort_by: z
    .enum([
      'releaseDate',
      'lastModifiedDate',
      'effectiveDate',
      'creationDate',
      'viewableDate',
      'pcReleaseDate',
      'upcoming',
      'price',
      'discount',
      'discountPercent',
    ])
    .optional(),
  q: z.string().optional(),
  page: z.number().optional(),
  developer: z.string().optional(),
  publisher: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().optional(),
  offerType: z
    .enum([
      'IN_GAME_PURCHASE',
      'BASE_GAME',
      'EXPERIENCE',
      'UNLOCKABLE',
      'ADD_ON',
      'Bundle',
      'CONSUMABLE',
      'WALLET',
      'OTHERS',
      'DEMO',
      'DLC',
      'VIRTUAL_CURRENCY',
      'BUNDLE',
      'DIGITAL_EXTRA',
      'EDITION',
      'SUBSCRIPTION',
    ])
    .optional(),
  tags: z.string().array().optional(),
  customAttributes: z.string().array().optional(),
  seller: z.string().optional(),
  sortBy: z
    .enum([
      'releaseDate',
      'lastModifiedDate',
      'effectiveDate',
      'creationDate',
      'viewableDate',
      'pcReleaseDate',
      'upcoming',
      'priceAsc',
      'priceDesc',
      'price',
      'discount',
      'discountPercent',
    ])
    .optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  limit: z.number().optional(),
  page: z.number().optional(),
  refundType: z.string().optional(),
  isCodeRedemptionOnly: z.boolean().optional(),
  excludeBlockchain: z.boolean().optional(),
  price: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  onSale: z.boolean().optional(),
  categories: z.string().array().optional(),
  developerDisplayName: z.string().optional(),
  publisherDisplayName: z.string().optional(),
});

export const Route = createFileRoute('/search')({
  component: () => {
    return (
      <SearchProvider>
        <RouteComponent />
      </SearchProvider>
    );
  },

  beforeLoad: ({ search }) => {
    return {
      search,
    };
  },

  loader: async ({ context }) => {
    const { country, queryClient, search } = context;

    const hash = search.hash;
    const initialTags = search.tags;
    const sortBy = search.sort_by;
    const q = search.q;
    const offerType = search.offer_type;
    const page = search.page;
    const categories = search.categories;
    const onSale = search.on_sale;
    const developerDisplayName = search.developerDisplayName;
    const publisherDisplayName = search.publisherDisplayName;

    const [tagsData, hashData, typesData] = await Promise.allSettled([
      queryClient.ensureQueryData({
        queryKey: ['tags'],
        queryFn: () => httpClient.get<FullTag[]>('/search/tags?raw=true'),
      }),
      queryClient.ensureQueryData({
        queryKey: [
          'hash',
          {
            hash,
            country,
          },
        ],
        queryFn: () =>
          httpClient.get<{
            [key: string]:
              | unknown
              | {
                  [key: string]: unknown;
                };
          }>(`/search/${hash}?country=${country}`, {}),
      }),
      queryClient.ensureQueryData({
        queryKey: ['offerTypes'],
        queryFn: () =>
          httpClient.get<
            {
              _id: string;
              count: number;
            }[]
          >('/search/offer-types'),
      }),
    ]);

    const tags = tagsData.status === 'fulfilled' ? tagsData.value : [];
    let query = hashData.status === 'fulfilled' ? hashData.value : null;
    const offerTypes = typesData.status === 'fulfilled' ? typesData.value : [];

    if (sortBy) {
      if (!query) query = {};
      query.sortBy = sortBy;
    }
    if (q) {
      if (!query) query = {};
      query.query = q;
    }
    if (offerType) {
      if (!query) query = {};
      query.offerType = offerType;
    }
    if (categories) {
      if (!query) query = {};
      query.categories = categories;
    }
    if (onSale) {
      if (!query) query = {};
      query.onSale = onSale;
    }
    if (developerDisplayName) {
      if (!query) query = {};
      query.developerDisplayName = developerDisplayName;
    }
    if (publisherDisplayName) {
      if (!query) query = {};
      query.publisherDisplayName = publisherDisplayName;
    }

    return {
      tags,
      hash: query,
      offerTypes,
      country,
      initialTags: initialTags
        ? Array.isArray(initialTags)
          ? initialTags.map((tag: number | string) => tag.toString())
          : [initialTags.toString()]
        : [],
      initialQuery: q,
      categories: categories ? categories : [],
      onSale: onSale ? onSale : undefined,
      page: page ? page : 1,
      dehydratedState: dehydrate(queryClient),
    };
  },

  validateSearch: zodSearchValidator(searchParamsSchema),

  loaderDeps(opts) {
    return {
      searchParams: opts.search,
    };
  },

  head() {
    return {
      meta: [
        {
          title: 'Search | egdata.app',
        },
        {
          name: 'description',
          content: 'Search for offers from the Epic Games Store.',
        },
        {
          name: 'og:title',
          content: 'Search | egdata.app',
        },
        {
          name: 'og:description',
          content: 'Search for offers from the Epic Games Store.',
        },
        {
          property: 'twitter:title',
          content: 'Search | egdata.app',
        },
        {
          property: 'twitter:description',
          content: 'Search for offers from the Epic Games Store.',
        },
      ],
    };
  },
});

function RouteComponent() {
  const loaderData = Route.useLoaderData();
  const { isFetching } = useSearchState();

  const form = useForm({
    defaultValues: {
      title: (loaderData.hash?.title as string) || '',
      offerType: (loaderData.hash?.offerType as string) || undefined,
      tags: (loaderData.initialTags as string[]) || undefined,
      customAttributes:
        (loaderData.hash?.customAttributes as string[]) || undefined,
      seller: (loaderData.hash?.seller as string) || undefined,
      sortBy: (loaderData.hash?.sortBy as string) || 'lastModifiedDate',
      sortDir: (loaderData.hash?.sortDir as string) || 'desc',
      limit: 28,
      page: loaderData.page || 1,
      refundType: (loaderData.hash?.refundType as string) || undefined,
      isCodeRedemptionOnly:
        (loaderData.hash?.isCodeRedemptionOnly as boolean) || undefined,
      excludeBlockchain:
        (loaderData.hash?.excludeBlockchain as boolean) || undefined,
      price: {
        // @ts-expect-error
        min: (loaderData.hash?.price?.min as number) ?? undefined,
        // @ts-expect-error
        max: (loaderData.hash?.price?.max as number) ?? undefined,
      },
      onSale: (loaderData.hash?.onSale as boolean) || undefined,
      categories: (loaderData.categories as string[]) || undefined,
      developerDisplayName:
        (loaderData.hash?.developerDisplayName as string) || undefined,
      publisherDisplayName:
        (loaderData.hash?.publisherDisplayName as string) || undefined,
    } as TypeOf<typeof formSchema>,
  });

  return (
    <div className="flex flex-col gap-4 min-h-screen">
      <main className="flex flex-row flex-nowrap items-start justify-between gap-4">
        <SearchFilters form={form} />
        <div className="flex flex-col gap-4 w-full justify-start items-start relative">
          <SearchHeader form={form} isFetching={isFetching} />
          <SearchForm
            form={form}
            defaultValues={form.state.values}
            initialPage={loaderData.page}
            initialHash={loaderData.hash?.query as string}
          />
        </div>
      </main>
    </div>
  );
}
