import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';
import { Button } from '../ui/button';
import { Image } from '../app/image';
import { getImage } from '~/lib/getImage';
import { Link } from '@remix-run/react';
import { cn } from '~/lib/utils';
import { useGenres } from '~/hooks/use-genres';
import { useCountry } from '~/hooks/use-country';
import { getTopSection } from '~/queries/top-section';

const platforms: Record<string, string> = {
  '9547': 'Windows',
  '10719': 'Mac OS',
};

export function TopSection({
  slug,
  title,
  side,
}: { slug: string; title: string; side: 'left' | 'right' }) {
  const { genres } = useGenres();
  const { country } = useCountry();
  const { data, isLoading } = useQuery({
    queryKey: ['top-section', { slug, limit: 1 }],
    queryFn: () => getTopSection(slug),
  });
  const { data: price } = useQuery({
    queryKey: [
      'price',
      {
        id: data?.elements[0].id ?? null,
      },
    ],
    queryFn: () =>
      client
        .get<SingleOffer['price']>(`/offers/${data?.elements[0].id}/price`, {
          params: { country },
        })
        .then((res) => res.data),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Not found</div>;
  }

  const offer = data.elements[0];

  return (
    <section className="w-full py-4 bg-card rounded-2xl" id={slug}>
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
          <div
            className={cn(
              'relative overflow-hidden rounded-lg',
              side === 'left' ? 'md:order-1' : '',
            )}
          >
            <Image
              src={
                getImage(offer.keyImages, ['OfferImageWide', 'DieselStoreFrontWide', 'Featured'])
                  ?.url
              }
              alt={offer.title}
              width={1920}
              height={1080}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                <GamepadIcon className="h-4 w-4" />
                <span>{title}</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{offer.title}</h2>
            </div>
            <p className="text-muted-foreground md:text-sm">{offer.description}</p>
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Release Date:</span>
                <span>
                  {new Date(offer.releaseDate).toLocaleDateString('en-UK', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <GamepadIcon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Platforms:</span>
                <span>
                  {offer.tags
                    .map((tag) => platforms[tag.id])
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Tags:</span>
                <span>
                  {offer.tags
                    .filter((tag) => !platforms[tag.id])
                    .filter((tag) => genres?.find((genre) => genre.id === tag.id))
                    .map((tag) => tag.name)
                    .slice(0, 4)
                    .join(', ')}
                </span>
              </div>
            </div>
            <div
              className={cn(
                'flex flex-row gap-4 items-center w-full justify-end',
                side === 'left' ? 'flex-row-reverse' : '',
              )}
            >
              <div>
                {price?.price?.discountPrice && (
                  <div className="inline-flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: price.price.currencyCode,
                      }).format(price.price.discountPrice / 100)}
                    </span>
                    {price.price.discountPrice < price.price.originalPrice && (
                      <span className="text-sm line-through text-muted-foreground">
                        {new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: price.price.currencyCode,
                        }).format(price.price.originalPrice / 100)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button asChild size="lg" className="w-full md:w-auto">
                <Link to={`/offers/${offer.id}`}>Check Offer</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function GamepadIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" x2="10" y1="12" y2="12" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" />
      <line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}

function UsersIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
