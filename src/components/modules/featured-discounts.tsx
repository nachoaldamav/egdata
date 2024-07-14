import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
import { Link } from '@remix-run/react';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { Button } from '../ui/button';
import { TerminalIcon } from '@primer/octicons-react';
import { Image } from '../app/image';
import { getImage } from '~/lib/getImage';
import { Media } from '~/types/media';
import { useState } from 'react';
import { FaApple, FaWindows } from 'react-icons/fa6';
import { cn } from '~/lib/utils';

export function FeaturedDiscounts() {
  const { data: featuredDiscounts } = useQuery({
    queryKey: ['featuredDiscounts'],
    queryFn: () =>
      client.get<SingleOffer[]>('/offers/featured-discounts').then((response) => response.data),
  });

  if (!featuredDiscounts) {
    return null;
  }

  return (
    <section id="featured-discounts">
      <Link
        className="text-xl font-bold text-left inline-flex group items-center gap-2"
        to="/search?hash=eadf1463682bf433c968c629f883ebb8"
        prefetch="viewport"
      >
        Featured Discounts{' '}
        <ArrowRightIcon className="w-6 h-6 inline-block group-hover:translate-x-1 transition-transform duration-300 ease-in-out" />
      </Link>
      <Carousel className="mt-2 h-full p-4">
        <CarouselPrevious />
        <CarouselContent>
          {featuredDiscounts.map((offer) => (
            <CarouselItem key={offer.id}>
              <FeaturedOffer offer={offer} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNext />
      </Carousel>
    </section>
  );
}

const platformIcons: Record<string, React.ReactNode> = {
  '9547': <FaWindows className="w-5 h-5 text-muted-foreground" />,
  '10719': <FaApple className="w-5 h-5 text-muted-foreground" />,
};

function FeaturedOffer({ offer }: { offer: SingleOffer }) {
  const [image, setImage] = useState<string | null>(null);
  const { data: offerMedia } = useQuery({
    queryKey: ['media', { id: offer.id }],
    queryFn: () => client.get<Media>(`/offers/${offer.id}/media`).then((response) => response.data),
  });

  return (
    <div className="w-full bg-background rounded-lg shadow-lg overflow-hidden group mx-auto select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-1 relative">
          <Image
            src={
              image ??
              getImage(offer.keyImages, ['OfferImageWide', 'DieselStoreFrontWide', 'Featured'])?.url
            }
            alt={offer.title}
            width={500}
            height={435}
            quality="original"
            className="w-full h-auto object-cover rounded-lg"
          />
        </div>
        <div className="md:col-span-1 flex flex-col justify-between px-4">
          <div className="h-fit">
            <h3 className="text-2xl font-bold">{offer.title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{offer.description}</p>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {offerMedia?.images.slice(0, 4).map((image) => (
                <div
                  className="h-auto w-full rounded-lg inline-flex items-center justify-center opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                  key={image._id}
                  onClick={() => setImage(image.src)}
                  onKeyDown={() => setImage(image.src)}
                >
                  <Image
                    key={image._id}
                    src={image.src}
                    alt={offer.title}
                    width={150}
                    height={75}
                    quality="original"
                    className="object-cover rounded-lg mx-auto"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm inline-flex gap-1 items-center justify-start">
                  {offer.tags.map((tag) => platformIcons[tag.id])}
                </span>
              </div>
              <Price offer={offer} />
            </div>
            <Button asChild size="lg" className="w-full mt-4 h-10">
              <Link to={`/offers/${offer.id}`} prefetch="viewport">
                Check Offer
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Price({ offer }: { offer: SingleOffer }) {
  const priceFmtd = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: offer.price.price.currencyCode || 'USD',
  });

  const isFree = offer.price.price.discountPrice === 0;

  return (
    <div className="flex items-end justify-end space-x-4">
      {offer.price.appliedRules.length > 0 && <SaleModule price={offer.price} />}
      <div className="flex flex-col gap-0">
        {offer.price.price.originalPrice !== offer.price.price.discountPrice && (
          <span className="line-through text-muted-foreground text-sm">
            {priceFmtd.format(offer.price.price.originalPrice / 100)}
          </span>
        )}
        {isFree ? (
          <span className="text-xl font-bold text-green-400">Free</span>
        ) : (
          <span className="text-xl font-bold text-green-400">
            {priceFmtd.format(offer.price.price.discountPrice / 100)}
          </span>
        )}
      </div>
    </div>
  );
}

function SaleModule({ price }: { price: SingleOffer['price'] }) {
  const selectedRule = price.appliedRules.sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
  )[0];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground inline-flex items-center">
        Until{' '}
        {new Date(selectedRule.endDate).toLocaleDateString('en-UK', {
          year: undefined,
          month: 'long',
          day: 'numeric',
        })}
      </span>
      <span className="text-lg inline-flex items-center bg-green-400 px-4 py-1 rounded-lg text-black font-extrabold">
        - {100 - selectedRule.discountSetting.discountPercentage}%
      </span>
    </div>
  );
}
