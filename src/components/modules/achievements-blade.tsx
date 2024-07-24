import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';
import type { Achievement, AchievementSet } from '~/queries/offer-achievements';
import { useCountry } from '~/hooks/use-country';
import { getRarity } from '~/lib/get-rarity';
import { Image } from '../app/image';
import { getImage } from '~/lib/getImage';
import { Link, useNavigate } from '@remix-run/react';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { FaTrophy } from 'react-icons/fa6';
import { cn } from '~/lib/utils';

type OfferWithAchievements = SingleOffer & {
  achievements: AchievementSet;
};

const rarityColors = {
  bronze: 'text-[#cd7f32]',
  silver: 'text-[#c0c0c0]',
  gold: 'text-[#ffd700]',
};

export function GamesWithAchievements() {
  const { country } = useCountry();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: [
      'games-with-achievements',
      {
        country,
      },
    ],
    queryFn: () =>
      client
        .get<OfferWithAchievements[]>('/offers/latest-achievements', {
          params: {
            country,
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

  if (!data) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <p>No data</p>
      </div>
    );
  }

  return (
    <section className="w-full flex flex-col gap-4">
      <Link
        to={'/search?tags=19847&sort_by=creationDate&offer_type=BASE_GAME'}
        className="text-xl font-bold text-left inline-flex gap-2 group items-center justify-start"
      >
        Games with Epic Achievements 🏆
        <ArrowRightIcon className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
      </Link>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Game</TableHead>
            <TableHead className="text-center">Achievements</TableHead>
            <TableHead className="text-center">XP</TableHead>
            <TableHead className="text-center">
              <span className="inline-flex items-center gap-2 justify-center">
                <FaTrophy className="size-3 text-[#cd7f32]" />
                <span>Bronze</span>
              </span>
            </TableHead>
            <TableHead className="text-center">
              <span className="inline-flex items-center gap-2 justify-center">
                <FaTrophy className="size-3 text-[#c0c0c0]" />
                <span>Silver</span>
              </span>
            </TableHead>
            <TableHead className="text-center">
              <span className="inline-flex items-center gap-2 justify-center">
                <FaTrophy className="size-3 text-[#ffd700]" />
                <span>Gold</span>
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((game) => (
            <TableRow
              key={game.id}
              onClick={() => {
                navigate(`/offers/${game.id}`);
              }}
              className="cursor-pointer hover:bg-card"
            >
              <TableCell className="inline-flex items-center gap-4">
                <span className="h-[40px] w-[75px]">
                  <Image
                    src={
                      getImage(game.keyImages, [
                        'DieselStoreFrontWide',
                        'Featured',
                        'OfferImageWide',
                      ])?.url
                    }
                    alt={game.title}
                    width={100}
                    height={50}
                    className="rounded-md w-full h-full object-cover"
                  />
                </span>
                <span>{game.title}</span>
              </TableCell>
              <TableCell className="text-center">{game.achievements.achievements.length}</TableCell>
              <TableCell className="text-center">
                {game.achievements.achievements.reduce((acc, ach) => acc + ach.xp, 0)}
              </TableCell>
              <NoOfAchievements achievements={game.achievements.achievements} rarity="bronze" />
              <NoOfAchievements achievements={game.achievements.achievements} rarity="silver" />
              <NoOfAchievements achievements={game.achievements.achievements} rarity="gold" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function NoOfAchievements({
  achievements,
  rarity,
}: { achievements: Achievement[]; rarity: keyof typeof rarityColors }) {
  return (
    <TableCell className={cn('text-center', rarityColors[rarity])}>
      {achievements.filter((ach) => getRarity(ach.xp) === rarity).length}
    </TableCell>
  );
}
