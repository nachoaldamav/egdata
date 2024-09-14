import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Image } from '~/components/app/image';
import { getQueryClient } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { httpClient } from '~/lib/http-client';
import { cn } from '~/lib/utils';
import type { Achievement } from '~/queries/offer-achievements';
import type { Profile } from '~/types/profiles';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '~/components/ui/carousel';
import { Separator } from '~/components/ui/separator';
import type { SingleOffer } from '~/types/single-offer';
import { EpicPlatinumIcon, EpicTrophyIcon } from './profile.$id';
import { getRarity } from '~/lib/get-rarity';
import { FlippableCard, textRarities } from '~/components/app/achievement-card';
import { ArrowUpIcon } from 'lucide-react';

type RareAchievement = Achievement & {
  unlocked: boolean;
  unlockDate: string;
  sandboxId: string;
  offer: SingleOffer;
};

export async function loader({ params }: LoaderFunctionArgs) {
  const queryClient = getQueryClient();

  if (!params.id) {
    return redirect('/');
  }

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['profile', { id: params.id }],
      queryFn: () => httpClient.get<Profile>(`/profiles/${params.id}`),
    }),
    queryClient.prefetchQuery({
      queryKey: ['player-rarest-achievements', { id: params.id }],
      queryFn: () => httpClient.get<Achievement[]>(`/profiles/${params.id}/rare-achievements`),
    }),
  ]);

  return {
    id: params.id,
    dehydratedState: dehydrate(queryClient),
  };
}

export default function Index() {
  const { dehydratedState } = useLoaderData<typeof loader>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <ProfilePage />
    </HydrationBoundary>
  );
}

function ProfilePage() {
  const { id } = useLoaderData<typeof loader>();
  const { data, isLoading } = useQuery({
    queryKey: ['profile', { id }],
    queryFn: () => httpClient.get<Profile>(`/profiles/${id}`),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Profile not found</div>;
  }

  return <ProfileInformation profile={data} />;
}

function ProfileInformation({ profile }: { profile: Profile }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [underlineStyle, setUnderlineStyle] = useState({});
  const tabRefs = useRef({});

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'achievements', label: 'Achievements' },
  ];

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab];
    if (activeTabElement) {
      setUnderlineStyle({
        left: `${activeTabElement.offsetLeft}px`,
        width: `${activeTabElement.offsetWidth}px`,
      });
    }
  }, [activeTab]);

  return (
    <div className=" p-4 rounded-lg">
      <div className="flex border-b border-gray-700 relative">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            ref={(el) => (tabRefs.current[tab.id] = el)}
            className={cn(
              'px-4 py-2 font-medium text-sm focus:outline-none',
              activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-200',
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <div
          className="absolute bottom-0 h-0.5 bg-white transition-all duration-300 ease-in-out"
          style={underlineStyle}
        />
      </div>
      <div className="mt-4">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4">
            <RarestAchievements />
            <div className="flex items-center flex-col gap-4">
              {profile.achievements?.data
                ?.sort((a, b) => {
                  const aTotalAchievements = a.productAchievements?.totalAchievements ?? 0;
                  const bTotalAchievements = b.productAchievements?.totalAchievements ?? 0;

                  // If any of them has `totalAchievements` set to 0, sort them by totalUnlocked descending
                  if (aTotalAchievements === 0 || bTotalAchievements === 0) {
                    return b.totalUnlocked - a.totalUnlocked;
                  }

                  // Calculate the percentage of achievements unlocked
                  const aPercentageUnlocked = a.totalUnlocked / aTotalAchievements;
                  const bPercentageUnlocked = b.totalUnlocked / bTotalAchievements;

                  if (aPercentageUnlocked === bPercentageUnlocked) {
                    // If percentages are equal, sort by totalAchievements descending
                    return bTotalAchievements - aTotalAchievements;
                  }

                  // Sort by percentage of achievements unlocked descending
                  return bPercentageUnlocked - aPercentageUnlocked;
                })
                ?.map((achievement) => (
                  <GameAchievementsSummary key={achievement.sandboxId} game={achievement} />
                ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && <AchievementsTimeline />}
      </div>
    </div>
  );
}

function GameAchievementsSummary({ game }: { game: Profile['achievements']['data'][0] }) {
  const { id } = useLoaderData<typeof loader>();
  return (
    <Link
      className="flex hover:bg-background bg-card text-white p-2 rounded-lg overflow-hidden transition-all duration-300 ease-in-out w-full gap-4"
      to={`/profile/${id}/achievements/${game.sandboxId}`}
    >
      <div className="w-1/4">
        <Image
          src={
            getImage(game.baseOfferForSandbox?.keyImages ?? [], [
              'DieselStoreFrontWide',
              'OfferImageWide',
              'DieselGameBoxWide',
              'TakeoverWide',
            ])?.url ?? '/placeholder.webp'
          }
          alt={game.product.name ?? game.sandboxId}
          width={650}
          height={400}
          className="rounded-md"
        />
      </div>
      <div className="w-2/4">
        <h2 className="text-2xl font-bold mb-2">{game.product.name}</h2>
        <div className="flex flex-row gap-4">
          <div className="flex items-start flex-col gap-2">
            <p className="text-sm text-gray-400">Achievements Progress</p>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 font-normal text-lg">
                <span className="text-white flex flex-row items-center gap-1">
                  {game.totalUnlocked /
                    (game.productAchievements?.totalAchievements ?? game.totalUnlocked) ===
                    1 && <EpicPlatinumIcon className="w-4 h-4 text-[#6e59e6]" />}
                  {(
                    (game.totalUnlocked /
                      (game.productAchievements?.totalAchievements ?? game.totalUnlocked)) *
                    100
                  ).toFixed(0)}
                  %
                </span>
                <span className="text-gray-500">|</span>
                <span className="text-white">
                  {game.totalUnlocked} /{' '}
                  {game.productAchievements?.totalAchievements ?? game.totalUnlocked} achievements
                </span>
              </span>
              <div className="w-full h-[6px] bg-gray-300/10 rounded-full">
                <div
                  className="h-[6px] bg-white rounded-full"
                  style={{
                    width: `${(game.totalUnlocked / (game.productAchievements?.totalAchievements ?? game.totalUnlocked)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-start flex-col gap-2">
            <p className="text-sm text-gray-400">Total XP Earned</p>
            <div className="flex flex-col gap-2">
              <span className="text-sm inline-flex items-center gap-2">
                <span className="text-white font-semibold text-lg">
                  {game.totalXP} / {game.productAchievements?.totalProductXP} XP
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="w-1/4">
        <SandboxRareAchievements id={id} sandbox={game.sandboxId} />
      </div>
    </Link>
  );
}

function SandboxRareAchievements({ id, sandbox }: { id: string; sandbox: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['sandbox:rarest-achievements', { id, sandbox }],
    queryFn: () =>
      httpClient.get<RareAchievement[]>(`/profiles/${id}/rare-achievements/${sandbox}`),
  });

  if (isLoading) return null;

  if (!data) return null;

  if (data.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 h-full">
        <h6 className="text-sm font-thin text-gray-300">Rarest Achievements</h6>
        <div className="flex gap-2 flex-col h-full justify-between">
          {data.slice(0, 3).map((achievement) => (
            <div key={achievement.name} className="flex flex-row gap-2">
              <div className="size-12 rounded-md flex-shrink-0">
                <Image
                  src={achievement.unlockedIconLink}
                  alt={achievement.name}
                  width={32}
                  height={32}
                  className="rounded-md size-16"
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-base font-light truncate">{achievement.unlockedDisplayName}</p>
                <p className="text-sm font-thin text-gray-300">
                  {achievement.completedPercent}% of players unlocked
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RarestAchievements() {
  const { id } = useLoaderData<typeof loader>();
  const [api, setApi] = useState<CarouselApi>();
  const { data } = useQuery({
    queryKey: ['player-rarest-achievements', { id }],
    queryFn: () => httpClient.get<RareAchievement[]>(`/profiles/${id}/rare-achievements`),
  });

  if (!data) {
    return null;
  }

  const handlePreviousSlide = () => {
    api?.scrollPrev();
  };

  const handleNextSlide = () => {
    api?.scrollNext();
  };

  return (
    <section className="flex flex-col gap-4 mt-4 mb-10">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-medium">Rarest Achievements</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousSlide}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-card text-muted-foreground hover:bg-gray-900 focus:outline-none focus:ring focus:ring-gray-300/50 disabled:opacity-50"
            type="button"
          >
            <ArrowUpIcon className="w-5 h-5 transform -rotate-90" />
          </button>
          <button
            onClick={handleNextSlide}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-card text-muted-foreground hover:bg-gray-900 focus:outline-none focus:ring focus:ring-gray-300/50 disabled:opacity-50"
            type="button"
          >
            <ArrowUpIcon className="w-5 h-5 transform rotate-90" />
          </button>
        </div>
      </div>
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {data.map((achievement) => (
            <CarouselItem key={achievement.name} className="md:basis-1/2 lg:basis-1/3">
              <RareAchievement achievement={achievement} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

function RareAchievement({ achievement }: { achievement: RareAchievement }) {
  return (
    <div className="flex flex-row gap-4 items-center bg-card px-4 py-6 rounded-lg w-full select-none">
      <img
        src={achievement.unlockedIconLink}
        alt={achievement.name}
        className="size-24 rounded-md"
      />
      <div className="flex flex-col gap-2">
        <h6 className="text-sm font-normal text-gray-400">
          {achievement.offer?.title ?? 'Unknown'}
        </h6>
        <h3 className="text-lg font-semibold">{achievement.unlockedDisplayName}</h3>
        <div className="flex flex-row gap-2 h-5">
          <p className="text-sm font-thin">{achievement.completedPercent}% of players unlocked</p>
          <Separator orientation="vertical" className="bg-white/25" />
          <p className="text-sm text-gray-400 inline-flex items-center gap-2">
            {achievement.xp} XP
            <EpicTrophyIcon
              className={cn('w-4 h-4 inline-block', textRarities[getRarity(achievement.xp)])}
            />
          </p>
        </div>
      </div>
    </div>
  );
}

type PlayerLatestAchievements = {
  achievements: Achievement &
    {
      offer: SingleOffer;
    }[];
  count: number;
  limit: number;
  page: number;
};

function AchievementsTimeline() {
  const { id } = useLoaderData<typeof loader>();
  const { data, isLoading } = useQuery({
    queryKey: ['profile:latest-achievements', { id, limit: 10, page: 1 }],
    queryFn: () => httpClient.get<PlayerLatestAchievements>(`/profiles/${id}/achievements`),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-col items-start justify-start h-full space-y-4 p-4">
      <h1 className="text-2xl font-bold mb-4">Achievements Timeline</h1>
      <section className="flex flex-col gap-4 w-full">
        {data.achievements.map((achievement) => (
          <SingleAchievement
            key={`${achievement.name}-${achievement.offer.namespace}`}
            achievement={achievement}
          />
        ))}
      </section>
    </div>
  );
}

function SingleAchievement({ achievement }: { achievement: Achievement & { offer: SingleOffer } }) {
  const { id } = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-row gap-4 w-full h-full">
      <Link
        className="max-w-72 w-full h-full cursor-pointer"
        to={`/profile/${id}/achievements/${achievement.offer.namespace}`}
      >
        <FlippableCard
          achievement={achievement}
          flipAll={false}
          flipped={false}
          onCardFlip={() => {}}
          index={0}
        />
      </Link>
      <div
        className="flex flex-col gap-4 w-full h-72 bg-opacity-20 rounded-md p-4 relative"
        style={{
          backgroundImage: `url(${getImage(achievement.offer.keyImages, ['DieselGameBoxWide', 'DieselStoreFrontWide', 'OfferImageWide'])?.url ?? '/placeholder.webp'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/** Gradient from bg-card to transparent to the right */}
        <div className="absolute inset-0 bg-gradient-to-l from-card/95 to-card z-0 rounded-md" />
        <div className="flex flex-col gap-2 h-full z-10">
          <h6 className="text-4xl">{achievement.offer.title}</h6>
          <p className="text-lg text-gray-200 font-thin">
            {new Date(achievement.unlockDate).toLocaleDateString('en-UK', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
