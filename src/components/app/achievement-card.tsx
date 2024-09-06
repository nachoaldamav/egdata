import { getRarity } from '~/lib/get-rarity';
import { cn } from '~/lib/utils';
import type { Achievement } from '~/queries/offer-achievements';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Image } from './image';

export const rarities = {
  bronze: 'bg-gradient-to-r from-bronze-start to-bronze-end shadow-glow-bronze',
  silver: 'bg-gradient-to-r from-silver-start to-silver-end shadow-glow-silver',
  gold: 'bg-gradient-to-r from-gold-start to-gold-end shadow-glow-gold',
  platinum: 'bg-gradient-to-r from-platinum-start to-platinum-end shadow-glow-platinum',
  unknown: 'bg-gray-300',
};

export const textRarities = {
  bronze: 'text-bronze-start',
  silver: 'text-silver-start',
  gold: 'text-gold-start',
  platinum: 'text-platinum-start',
  unknown: 'text-gray-300',
};

export function FlippableCard({
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
              <div className="h-16 w-16 opacity-25">
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
