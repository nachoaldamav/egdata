import { useQuery } from '@tanstack/react-query';
import { useCountry } from '~/hooks/use-country';
import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Image } from '../app/image';
import { getImage } from '~/lib/getImage';
import { Link, useNavigate } from '@remix-run/react';
import { ArrowRightIcon } from '@radix-ui/react-icons';

type UpcomingOffer = Pick<
  SingleOffer,
  | 'id'
  | 'namespace'
  | 'title'
  | 'offerType'
  | 'keyImages'
  | 'seller'
  | 'developerDisplayName'
  | 'publisherDisplayName'
  | 'releaseDate'
  | 'prePurchase'
  | 'price'
>;

type Res = {
  elements: UpcomingOffer[];
  limit: number;
  start: number;
  page: number;
  count: number;
};

export function UpcomingOffers() {
  const { country } = useCountry();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['upcoming', { country }],
    queryFn: () =>
      client.get<Res>('/offers/upcoming', { params: { country } }).then((res) => res.data),
  });

  if (isLoading) {
    return (
      <Table>
        <TableCaption>Loading...</TableCaption>
      </Table>
    );
  }

  return (
    <section id="upcoming-offers" className="mb-8 w-[70vw]">
      <Link className="text-xl font-bold text-left inline-flex group items-center gap-2" to="#">
        Upcoming Offers{' '}
        <ArrowRightIcon className="w-6 h-6 inline-block group-hover:translate-x-1 transition-transform duration-300 ease-in-out" />
      </Link>
      <Table className="w-full">
        <TableCaption>Upcoming Offers</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]" />
            <TableHead>Title</TableHead>
            <TableHead className="text-right w-[150px]">Price</TableHead>
            <TableHead className="text-right">Release Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.elements.map((offer) => (
            <TableRow
              key={offer.id}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              onClick={() => {
                navigate(`/offers/${offer.id}`);
              }}
            >
              <TableCell>
                <Image
                  src={
                    getImage(offer.keyImages, [
                      'OfferImageWide',
                      'DieselGameBoxWide',
                      'DieselStoreFrontWide',
                      'Featured',
                    ])?.url
                  }
                  alt={offer.title}
                  width={300}
                  height={150}
                  className="object-cover rounded"
                />
              </TableCell>
              <TableCell className="w-1/2">{offer.title}</TableCell>
              <TableCell className="text-right w-[150px]">
                <TablePrice price={offer.price} prePurchase={offer.prePurchase} />
              </TableCell>
              <TableCell className="text-right">
                {new Date(offer.releaseDate).toLocaleDateString('en-UK', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function TablePrice({
  price,
  prePurchase,
}: { price: UpcomingOffer['price'] | null; prePurchase: boolean | null }) {
  const fmt = Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price?.price.currencyCode || 'USD',
  });

  if (!price) {
    return 'Unknown';
  }

  return (
    <div className="inline-flex items-center gap-2">
      {prePurchase && (
        <span className="bg-red-400 text-white text-xs font-semibold px-2 py-1 rounded-full">
          Pre-order
        </span>
      )}
      <span className="text-primary font-bold">{fmt.format(price.price.discountPrice / 100)}</span>
    </div>
  );
}