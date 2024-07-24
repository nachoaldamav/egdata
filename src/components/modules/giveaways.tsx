import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';
import { Skeleton } from '../ui/skeleton';
import { Image } from '../app/image';
import { getImage } from '~/lib/getImage';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { useCountry } from '~/hooks/use-country';
import { useEffect, useState } from 'react';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Link } from '@remix-run/react';
import type { GiveawayOffer } from '~/types/giveaways';

export function GiveawaysCarousel({
  initialData,
}: {
  initialData: GiveawayOffer[];
}) {
  const { country } = useCountry();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['giveaways'],
    queryFn: () =>
      client
        .get<GiveawayOffer[]>('/free-games', {
          params: {
            country,
          },
        })
        .then((res) => res.data),
    initialData,
  });

  if (isLoading) {
    return (
      <section id="giveaways-carousel">
        <div className="flex items-center justify-center">
          <Skeleton className="h-[300px]" />
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return null;
  }

  return (
    <section
      id="giveaways-carousel"
      className="flex flex-col items-start justify-start w-full gap-4"
    >
      <h2 className="text-xl font-bold">Giveaways 🎁</h2>
      <div className="flex flex-row items-center justify-evenly gap-6 w-full">
        {data.map((offer) => (
          <GiveawayCard key={offer.id} offer={offer} />
        ))}
      </div>
    </section>
  );
}

function GiveawayCard({ offer }: { offer: GiveawayOffer }) {
  const startDate = new Date(offer.giveaway.startDate);
  const endDate = new Date(offer.giveaway.endDate);
  const now = new Date();

  const isOnGoing = startDate < now && endDate > now;
  const isUpcoming = startDate > now;
  const isEnded = endDate < now;

  const priceFmtr = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: offer.price.price.currencyCode,
  });

  return (
    <Link to={`/offers/${offer.id}`}>
      <Card className="w-[300px] border-transparent">
        <CardHeader className="p-0 rounded-t-xl relative">
          <Image
            src={
              getImage(offer.keyImages, ['DieselGameBoxWide', 'OfferImageWide', 'Featured'])?.url
            }
            alt={offer.title}
            className="w-full h-[200px] object-cover rounded-t-xl"
            width={400}
            height={225}
          />
          {isUpcoming && (
            <div className="absolute bottom-0 left-0 bg-blue-700 text-white text-sm p-1 w-full text-center">
              starts in <Countdown targetDate={startDate} />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg font-medium">{offer.title}</CardTitle>
        </CardContent>
        <CardFooter className="px-4 pb-4 rounded-b-xl gap-2 justify-between items-baseline">
          <div className="inline-flex items-center gap-2">
            <span className="text-xl font-bold">
              {isOnGoing ? 'Free' : priceFmtr.format(offer.price.price.originalPrice / 100)}
            </span>
            {isOnGoing && (
              <span className="text-sm font-semibold inline-flex items-center gap-1 line-through">
                {priceFmtr.format(offer.price.price.originalPrice / 100)}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold inline-flex items-center gap-1">
            <TooltipProvider>
              Repeated:{' '}
              {offer.giveaway.historical.length > 1 ? (
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    Yes
                    <InfoCircledIcon className="w-4 h-4" />
                  </TooltipTrigger>
                  <TooltipContent className="flex flex-col gap-1">
                    <i className="text-xs font-normal">
                      This giveaway has been repeated {offer.giveaway.historical.length} times.
                    </i>
                    <div className="flex flex-col gap-1">
                      {offer.giveaway.historical.map((historical) => (
                        <span key={historical.id}>
                          {new Date(historical.startDate).toLocaleDateString('en-UK', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          -{' '}
                          {new Date(historical.endDate).toLocaleDateString('en-UK', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                'No'
              )}
            </TooltipProvider>
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  if (targetDate < new Date()) {
    return 'Ended';
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.days < 0 && timeLeft.hours < 0 && timeLeft.minutes < 0 && timeLeft.seconds < 0) {
    return 'Ended';
  }

  return (
    <span className="font-semibold">
      {timeLeft.days > 0 && `${timeLeft.days}d `}
      {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:
      {timeLeft.seconds.toString().padStart(2, '0')}
    </span>
  );
}
