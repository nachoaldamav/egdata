import type { SingleOffer } from '~/types/single-offer';
import { CarouselItem } from '../ui/carousel';
import { Link } from '@remix-run/react';
import { Card, CardContent } from '../ui/card';
import { Image } from './image';
import { getImage } from '~/lib/getImage';

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
