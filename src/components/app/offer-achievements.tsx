import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { type Achievement, fetchAchievementsSets } from '~/queries/offer-achievements';
import { Image } from './image';
import { useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '~/lib/utils';
import { getRarity } from '~/lib/get-rarity';
import { Button } from '../ui/button';
import { CardStackIcon } from '@radix-ui/react-icons';

export function OfferAchievements({ id }: { id: string }) {
  const { data, error } = useQuery({
    queryKey: ['offer-achievements', { id }],
    queryFn: () => fetchAchievementsSets({ id }),
  });

  const [flipAll, setFlipAll] = useState(false);

  const handleFlipAll = () => {
    setFlipAll(!flipAll);
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mt-4">
        {Array.from({ length: 20 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: This is a skeleton component
          <SkeletonCard key={i} />
        ))}
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
              />
            ))}
          </div>
          <hr className="w-full my-4 border-gray-300/40" />
        </div>
      ))}
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
}: { achievement: Achievement; flipAll: boolean; index: number }) {
  const [flipped, setFlipped] = useState(false);

  const handleClick = () => setFlipped(!flipped);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setFlipped(!flipped);
    }
  };

  const flipState = flipAll ? 'flipped' : '';
  const delay = `${index * 100}ms`;

  const rarity = getRarity(achievement.xp);

  return (
    <div
      className="relative h-72 w-full perspective cursor-default"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={achievement.unlockedDisplayName}
    >
      <div
        className={`card ${flipped || flipAll ? 'flipped' : ''}`}
        style={{ transitionDelay: delay }}
      >
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
