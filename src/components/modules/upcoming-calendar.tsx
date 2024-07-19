import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';
import { OfferCard } from '../app/offer-card';
import { Carousel, CarouselContent } from '../ui/carousel';
import { useCountry } from '~/hooks/use-country';
import { Link } from '@remix-run/react';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';

interface UpcomingRes {
  elements: SingleOffer[];
  limit: number;
  start: number;
  page: number;
  count: number;
}

export function UpcomingCalendar() {
  const { country } = useCountry();
  const { data, isLoading } = useQuery({
    queryKey: [
      'upcoming',
      {
        country,
        page: 1,
      },
    ],
    queryFn: () =>
      client
        .get<UpcomingRes>('/offers/upcoming', {
          params: {
            country,
            page: 1,
          },
        })
        .then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const groupedOffersByDay = data?.elements.reduce(
    (acc, offer) => {
      const releaseDate = new Date(offer.releaseDate);
      const key = releaseDate.toDateString();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(offer);
      return acc;
    },
    {} as Record<string, SingleOffer[]>,
  );

  return (
    <section id="upcoming-calendar" className="mb-8 w-full">
      <Link
        className="text-xl font-bold text-left inline-flex group items-center gap-2"
        to="/search?sort_by=upcoming"
      >
        Upcoming Offers{' '}
        <ArrowRightIcon className="w-6 h-6 inline-block group-hover:translate-x-1 transition-transform duration-300 ease-in-out" />
      </Link>
      <Carousel className="mt-2 h-full p-4 select-none">
        <CarouselContent className="gap-4 ml-0">
          {groupedOffersByDay &&
            Object.entries(groupedOffersByDay).map(([date, offers]) => (
              <div
                className="flex flex-col w-fit border p-3 rounded-xl gap-2 bg-opacity-25"
                key={date}
              >
                <h3 className="text-xl">{relativeDate(new Date(date))}</h3>
                <div className="flex flex-row gap-4">
                  {offers.map((offer) => (
                    <div key={offer.id} className="min-w-60 relative">
                      {
                        /* If the difference between right now and the game release is 1 day or less, show the timer */
                        new Date(offer.releaseDate).getTime() - Date.now() <
                          1000 * 60 * 60 * 24 && (
                          <FloatingCountdown date={new Date(offer.releaseDate)} />
                        )
                      }

                      <OfferCard offer={offer} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

function relativeDate(date: Date) {
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = date.getTime() - Date.now();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return formatter.format(days, 'day');
}

/**
 * Live countdown timer
 * @param param0
 * @returns
 */
function FloatingCountdown({ date }: { date: Date }) {
  const [timeLeft, setTimeLeft] = useState(() => date.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(date.getTime() - Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [date]);

  return (
    <div className="absolute top-0 right-0 dark:bg-gray-800/50 p-2 rounded-tr-lg rounded-bl-lg shadow-lg z-50 backdrop-blur-sm">
      <p>{formatTimeLeft(timeLeft)}</p>
    </div>
  );
}

/**
 * Formats the time left in days, hours, minutes and seconds
 * @param timeLeft
 * @returns
 */
function formatTimeLeft(timeLeft: number) {
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  let formatted = '';
  if (hours > 0) {
    if (hours < 10) {
      formatted += `0${hours}:`;
    } else {
      formatted += `${hours}:`;
    }
  }

  if (minutes < 10) {
    formatted += `0${minutes}:`;
  } else {
    formatted += `${minutes}:`;
  }

  if (seconds < 10) {
    formatted += `0${seconds}`;
  } else {
    formatted += `${seconds}`;
  }

  return formatted;
}
