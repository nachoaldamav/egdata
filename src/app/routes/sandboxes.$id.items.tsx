import type { LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { Image } from '~/components/app/image';
import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';

type SandboxOffer = Pick<
  SingleOffer,
  | 'id'
  | 'title'
  | 'description'
  | 'offerType'
  | 'effectiveDate'
  | 'creationDate'
  | 'lastModifiedDate'
  | 'keyImages'
  | 'productSlug'
  | 'releaseDate'
>;

export async function loader({ params }: LoaderFunctionArgs) {
  const [itemsData] = await Promise.allSettled([
    client.get<SandboxOffer[]>(`/sandboxes/${params.id}/items`),
  ]);

  const items = itemsData.status === 'fulfilled' ? itemsData.value.data : [];

  return { items };
}

export default function Index() {
  const { items } = useLoaderData<typeof loader>();
  return (
    <section className="flex-1 p-4">
      <h1 className="text-2xl font-bold">Items</h1>
      <div className="grid grid-cols-1 gap-4 mt-4">
        {items.map((item) => (
          <Link key={item.id} to={`/items/${item.id}`}>
            <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <Image
                  src={item.keyImages[0]?.url}
                  alt={item.title}
                  width={64}
                  height={64}
                  className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
