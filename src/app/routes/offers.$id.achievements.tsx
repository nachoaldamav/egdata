import { CardStackIcon } from '@radix-ui/react-icons';
import type { LoaderFunction } from '@remix-run/node';
import { json, useLoaderData, type ClientLoaderFunctionArgs } from '@remix-run/react';
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
import { client } from '~/lib/client';
import { getRarity } from '~/lib/get-rarity';
import { cn } from '~/lib/utils';
import type { Achievement, AchievementsSets } from '~/queries/offer-achievements';

export const loader: LoaderFunction = async ({ params }) => {
  const data = await client
    .get<AchievementsSets>(`/offers/${params.id}/achievements`)
    .then((res) => res.data);

  return json({
    data,
  });
};

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  const data = await client
    .get<AchievementsSets>(`/offers/${params.id}/achievements`)
    .then((res) => res.data);

  return {
    data,
  };
};

export default function OfferAchievements() {
  const { data } = useLoaderData<typeof clientLoader>();

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
                flipped={flippedStates[achievement.name] || false}
                onCardFlip={handleCardFlip}
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
      className="relative h-72 w-full perspective cursor-default"
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
