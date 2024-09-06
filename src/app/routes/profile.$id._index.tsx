import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Image } from '~/components/app/image';
import { getQueryClient } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { httpClient } from '~/lib/http-client';
import { cn } from '~/lib/utils';
import type { Profile } from '~/types/profiles';

export async function loader({ params }: LoaderFunctionArgs) {
  const queryClient = getQueryClient();

  if (!params.id) {
    return redirect('/');
  }

  await queryClient.prefetchQuery({
    queryKey: ['profile', { id: params.id }],
    queryFn: () => httpClient.get<Profile>(`/profiles/${params.id}`),
  });

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
            <h2 className="text-2xl font-bold">Player Summary</h2>
            <div className="flex items-center flex-col gap-4">
              {profile.achievements?.data
                ?.sort((a, b) => b.totalUnlocked - a.totalUnlocked)
                ?.map((achievement) => (
                  <GameAchievementsSummary key={achievement.sandboxId} game={achievement} />
                ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            <h4 className="text-2xl font-bold">Detailed Achievements</h4>
          </div>
        )}
      </div>
    </div>
  );
}

function GameAchievementsSummary({ game }: { game: Profile['achievements']['data'][0] }) {
  const { id } = useLoaderData<typeof loader>();
  return (
    <Link
      className="flex hover:bg-background bg-card text-white p-4 rounded-lg overflow-hidden transition-all duration-300 ease-in-out w-full"
      to={`/profile/${id}/achievements/${game.sandboxId}`}
    >
      <div className="w-1/3 mr-4">
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
          width={640}
          height={360}
          className="rounded-md"
        />
      </div>
      <div className="w-2/3">
        <h2 className="text-2xl font-bold mb-2">{game.product.name}</h2>
        <div className="flex flex-row gap-4">
          <div className="flex items-start flex-col gap-2">
            <p className="text-sm text-gray-400">Achievements Progress</p>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 font-normal text-lg">
                <span className="text-white">
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
    </Link>
  );
}