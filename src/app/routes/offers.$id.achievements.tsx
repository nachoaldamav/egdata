import { CardStackIcon } from '@radix-ui/react-icons';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, type ClientLoaderFunctionArgs } from '@remix-run/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Image } from '~/components/app/image';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { getQueryClient } from '~/lib/client';
import { getRarity } from '~/lib/get-rarity';
import { httpClient } from '~/lib/http-client';
import { cn } from '~/lib/utils';
import type { Achievement, AchievementsSets } from '~/queries/offer-achievements';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery<AchievementsSets>({
    queryKey: ['achievements', { id: params.id }],
    queryFn: () => httpClient.get<AchievementsSets>(`/offers/${params.id}/achievements`),
  });

  return {
    id: params.id,
    initialData: data,
  };
};

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  return {
    id: params.id,
    initialData: null,
  };
};

export default function OfferAchievements() {
  const { id, initialData } = useLoaderData<typeof clientLoader | typeof loader>();
  const { data, isLoading } = useQuery({
    queryKey: [
      'achievements',
      {
        id,
      },
    ],
    queryFn: () => httpClient.get<AchievementsSets>(`/offers/${id}/achievements`),
    initialData: initialData ?? undefined,
    retry: false,
  });

  const [flipAll, setFlipAll] = useState(false);
  const [flippedStates, setFlippedStates] = useState<{ [key: string]: boolean }>({});

  const handleFlipAll = () => {
    setFlipAll(!flipAll);
  };

  const handleCardFlip = (achievementName: string) => {
    setFlippedStates((prev) => ({
      ...prev,
      [achievementName]: !prev[achievementName],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Achievements</h1>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mt-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">No achievements found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-full justify-between items-center">
        <h1 className="text-2xl font-bold">Achievements</h1>
        <Button
          className="hover:bg-transparent border border-gray-800 bg-gray-800 inline-flex px-4 py-2 rounded-md text-center transition-all duration-300 ease-in-out text-white"
          onClick={handleFlipAll}
          disabled={data.length === 0}
        >
          <CardStackIcon className="w-6 h-6 mr-2" />
          Flip All
        </Button>
      </div>
      {data.map((achievementSet) => (
        <div key={achievementSet.achievementSetId}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mt-4">
            {achievementSet.achievements.map((achievement, index) => (
              <FlippableCard
                key={achievement.name}
                achievement={achievement}
                flipAll={flipAll}
                index={index}
                flipped={flippedStates[achievement.name] || false}
                onCardFlip={handleCardFlip}
              />
            ))}
          </div>
          <hr className="w-full my-4 border-gray-300/40" />
        </div>
      ))}
      {data.length === 0 && (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">No achievements found</p>
        </div>
      )}
    </div>
  );
}

const rarities = {
  bronze: 'bg-gradient-to-r from-bronze-start to-bronze-end shadow-glow-bronze',
  silver: 'bg-gradient-to-r from-silver-start to-silver-end shadow-glow-silver',
  gold: 'bg-gradient-to-r from-gold-start to-gold-end shadow-glow-gold',
  platinum: 'bg-gradient-to-r from-platinum-start to-platinum-end shadow-glow-platinum',
  unknown: 'bg-gray-300',
};

function FlippableCard({
  achievement,
  flipAll,
  index,
  flipped,
  onCardFlip,
}: {
  achievement: Achievement;
  flipAll: boolean;
  index: number;
  flipped: boolean;
  onCardFlip: (name: string) => void;
}) {
  const handleClick = () => onCardFlip(achievement.name);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onCardFlip(achievement.name);
    }
  };

  const delay = flipAll ? `${index * 100}ms` : '0ms';
  const flipState = flipped === flipAll ? '' : 'flipped';

  const rarity = getRarity(achievement.xp);

  return (
    <div
      className="relative h-72 w-full perspective cursor-default select-none"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={achievement.unlockedDisplayName}
    >
      <div className={cn('card', flipState)} style={{ transitionDelay: delay }}>
        <div className="front">
          <Card className="justify-between flex flex-col h-full">
            <CardHeader className="flex flex-col w-full items-center gap-2">
              <div className={cn('h-16 w-16 rounded-sm bg-opacity-25 relative', rarities[rarity])}>
                <Image
                  src={achievement.unlockedIconLink}
                  alt={achievement.unlockedDisplayName}
                  height={64}
                  width={64}
                  className="z-10 bg-gray-900 rounded-sm"
                />
              </div>
              <CardTitle>{achievement.unlockedDisplayName}</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <CardDescription>{achievement.unlockedDescription}</CardDescription>
            </CardContent>
            <CardFooter>
              <span className="border border-gray-300 rounded-full px-2 py-1 text-xs">
                {achievement.completedPercent}% unlocked
              </span>
            </CardFooter>
          </Card>
        </div>
        <div className="back">
          <Card className="justify-between flex flex-col h-full">
            <CardHeader className="flex flex-col w-full items-center gap-2">
              <div className="h-16 w-16">
                <Image
                  src={achievement.lockedIconLink}
                  alt={achievement.lockedDisplayName}
                  height={64}
                  width={64}
                />
              </div>
              <CardTitle>
                {achievement.lockedDisplayName === '' ? 'REDACTED' : achievement.lockedDisplayName}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <CardDescription>{achievement.lockedDescription}</CardDescription>
            </CardContent>
            <CardFooter>
              <span className="border border-gray-300 rounded-full px-2 py-1 text-xs">Locked</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="justify-between flex flex-col h-full">
      <CardHeader className="flex flex-col w-full items-center gap-2">
        <Skeleton className="h-16 w-16" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="h-full">
        <Skeleton className="h-16" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-16" />
      </CardFooter>
    </Card>
  );
}
