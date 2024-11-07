import { getQueryClient } from '@/lib/client';
import { generateItemMeta } from '@/lib/generate-item-meta';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { httpClient } from '@/lib/http-client';
import type { SingleItem } from '@/types/single-item';
import { dehydrate, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/items/$id/images')({
  component: () => {
    const { id } = Route.useParams();
    const { data: item } = useQuery({
      queryKey: ['item', { id }],
      queryFn: () => httpClient.get<SingleItem>(`/items/${id}`),
    });

    if (!item) {
      return null;
    }

    return (
      <div className="flex flex-col items-start justify-start h-full gap-4 w-full">
        <h2 className="text-xl font-bold">Images</h2>
        <div className=" mt-2">
          <div className="flex flex-row items-start justify-start flex-wrap gap-2">
            {item.keyImages.map((image) => (
              <div
                key={image.md5}
                className="flex flex-col gap-2 items-start justify-start w-1/3"
              >
                <img
                  src={image.url}
                  alt={item.title}
                  className="rounded-lg h-auto  object-cover"
                />
                <span className="text-sm text-muted-foreground w-full text-center">
                  {image.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },

  loader: async ({ context, params }) => {
    const { queryClient } = context;

    return {
      id: params.id,
      dehydratedState: dehydrate(queryClient),
    };
  },

  meta({ params, loaderData }) {
    const queryClient = getQueryClient();
    const { dehydratedState } = loaderData;
    const { id } = params;

    const item = getFetchedQuery<SingleItem>(queryClient, dehydratedState, [
      'item',
      { id },
    ]);

    if (!item) {
      return [
        {
          title: 'Item not found',
          description: 'Item not found',
        },
      ];
    }

    return generateItemMeta(item, 'Images');
  },
});
