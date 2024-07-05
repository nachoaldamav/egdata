import type { SingleOffer } from '~/types/single-offer';
import { CarouselItem } from '../ui/carousel';
import { Link } from '@remix-run/react';
import { Card, CardContent } from '../ui/card';
import { Image } from './image';
import { getImage } from '~/lib/getImage';
import { HeartIcon, CalendarIcon } from '@radix-ui/react-icons';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ThumbsdownIcon, ThumbsupIcon } from '@primer/octicons-react';
import { cn } from '~/lib/utils';
import { offersDictionary } from '~/lib/offers-dictionary';

export function GameCard({
  game,
}: {
  game: Pick<
    SingleOffer,
    'id' | 'keyImages' | 'title' | 'seller' | 'developerDisplayName' | 'publisherDisplayName'
  >;
}) {
  return (
    <CarouselItem key={game.id} className="basis-1/1 lg:basis-1/4">
      <Link to={`/offers/${game.id}`} className="w-96 relative select-none" prefetch="viewport">
        <Card className="w-72 lg:max-w-sm rounded-lg overflow-hidden shadow-lg">
          <Image
            src={getImage(game.keyImages, ['Thumbnail'])?.url}
            alt={game.title}
            width={400}
            height={500}
            className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300"
          />
          <CardContent className="p-4 flex-grow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold max-w-xs truncate">{game.title}</h3>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2 h-full max-w-xs truncate">
              {game.seller && (
                <div className="text-sm text-gray-400">
                  {typeof game.seller === 'string' ? game.seller : game.seller.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </CarouselItem>
  );
}

/**
 * List type offer item (for list view)
 * @param param0
 * @returns
 */
export function OfferListItem({
  game,
}: {
  game: Pick<
    SingleOffer,
    | 'id'
    | 'keyImages'
    | 'title'
    | 'seller'
    | 'developerDisplayName'
    | 'publisherDisplayName'
    | 'tags'
    | 'releaseDate'
    | 'price'
    | 'offerType'
  >;
}) {
  const epicImage = getImage(game.keyImages, [
    'DieselGameBoxWide',
    'OfferImageWide',
    'TakeoverWide',
  ])?.url as string | undefined;

  const priceFmtd = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: game.price.price.currencyCode || 'USD',
  });

  return (
    <Link to={`/offers/${game.id}`} className="w-full" prefetch="viewport">
      <Card className="flex flex-row w-full bg-[#1b1e2b] text-white p-1 rounded-lg h-44">
        <div className="flex-shrink-0 w-72 h-full">
          <img
            src={
              epicImage
                ? `${epicImage}?h=500&resize=1&quality=medium`
                : 'https://via.placeholder.com/300x150?text=No+Image'
            }
            alt={game.title}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="flex flex-col flex-grow ml-2 p-2 w-full justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center jusitfy-start space-x-2">
                <h2 className="text-xl font-bold truncate">{game.title}</h2>
                <span className="text-sm text-muted-foreground inline-flex items-center">-</span>
                <span className="text-sm text-muted-foreground inline-flex items-center">
                  {offersDictionary[game.offerType] || game.offerType}
                </span>
              </div>
              <div className="flex flex-wrap mt-1 space-x-2">
                {game.tags.slice(0, 5)?.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="inline-flex gap-2 items-center justify-start my-2">
            <span className="text-sm text-muted-foreground inline-flex items-center">
              {game.seller.name}
            </span>
          </div>
          <div className="inline-flex gap-2 items-center justify-start">
            <span className="text-sm text-muted-foreground inline-flex items-center">
              Release date:{' '}
              {new Date(game.releaseDate).toLocaleString('en-UK', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          {game.price && (
            <div className="flex items-end justify-end space-x-4">
              {game.price.appliedRules.length > 0 && <SaleModule game={game} />}
              {game.price.price.originalPrice !== game.price.price.discountPrice && (
                <span className="line-through text-muted-foreground">
                  {priceFmtd.format(game.price.price.originalPrice / 100)}
                </span>
              )}
              <span
                className={cn(
                  'text-lg font-bold',
                  game.price.price.originalPrice !== game.price.price.discountPrice
                    ? 'text-green-400'
                    : 'text-white',
                )}
              >
                {priceFmtd.format(game.price.price.discountPrice / 100)}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

/**
 * Shows the 1st applied rule of the offer that the end date is not passed
 */
function SaleModule({ game }: { game: Pick<SingleOffer, 'price'> }) {
  const sale = game.price.appliedRules.find((rule) => {
    return new Date(rule.endDate) > new Date();
  });

  if (!sale) return null;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center">
        <span className="text-sm text-muted-foreground">
          ends in {relativeFutureDate(new Date(sale.endDate))} days
        </span>
      </div>
      <Badge variant="default" className="bg-green-500 text-black text-sm">
        -{sale.discountSetting.discountPercentage}%
      </Badge>
    </div>
  );
}

const relativeFutureDate = (date: Date) => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days;
};
