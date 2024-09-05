import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { LayoutGridIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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

  const userTotalXP = data.achievements.data?.reduce((acc, curr) => acc + curr.totalXP, 0);

  // Each level is 250 XP
  const userLevel = Math.floor(userTotalXP / 250);
  const xpToNextLevel = userTotalXP % 250;
  const percentToNextLevel = (xpToNextLevel / 250) * 100;

  return (
    <main className="flex flex-col items-start justify-start w-full min-h-screen gap-4 mt-10">
      <BackgroundImage profile={data} />
      <section id="profile-header" className="flex flex-row gap-10 w-full">
        <img
          src={data.avatar.large}
          alt={data.displayName}
          className="rounded-full h-32 w-32 object-cover"
        />
        <div className="flex flex-col gap-4">
          <h1 className="text-6xl font-thin">{data.displayName}</h1>
          <section
            id="profile-header-achievements"
            className="flex flex-row w-full items-start justify-start"
          >
            <div id="player-level" className="flex flex-col gap-2 w-fit min:w-[250px] mr-10">
              <SectionTitle title="Level" />
              <div className="flex flex-row gap-2 items-center mb-3">
                <p className="text-4xl font-light inline-flex items-center gap-1">
                  <LevelIcon className="size-7 inline-block" />
                  {userLevel}
                </p>
                <p className="text-4xl font-thin">|</p>
                <p className="text-4xl font-light">{userTotalXP} XP</p>
              </div>
              <div className="flex flex-col gap-2 items-start">
                <div className="w-full h-[6px] bg-gray-300/10 rounded-full">
                  <div
                    className="h-[6px] bg-white rounded-full"
                    style={{ width: `${percentToNextLevel}%` }}
                  />
                </div>
                <p className="text-sm font-light opacity-50">{xpToNextLevel} XP to next level</p>
              </div>
            </div>
            <div id="player-achievements-count" className="flex flex-col gap-2 w-[175px]">
              <SectionTitle title="Achievements" />
              <p className="text-3xl font-light inline-flex items-center gap-2">
                <EpicTrophyIcon className="size-7 inline-block" />
                {data.achievements.data?.reduce((acc, curr) => acc + curr.totalUnlocked, 0)}
              </p>
            </div>
            <div id="player-platinum-count" className="flex flex-col gap-2 w-[175px]">
              <SectionTitle title="Platinum" />
              <p className="text-3xl font-light inline-flex items-center gap-2">
                <EpicPlatinumIcon className="size-7 inline-block" />
                {data.achievements.data?.reduce(
                  (acc, curr) => acc + (curr.playerAwards.length ?? 0),
                  0,
                )}
              </p>
            </div>
            <div id="player-library" className="flex flex-col gap-2 w-[175px]">
              <SectionTitle title="Library" />
              <p className="text-3xl font-light inline-flex items-center gap-2">
                <LayoutGridIcon className="size-7 inline-block" fill="currentColor" />
                {data.achievements.data?.length ?? 0}
              </p>
            </div>
          </section>
        </div>
      </section>
      <section className="mt-20 w-full">
        <ProfileInformation profile={data} />
      </section>
    </main>
  );
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
  return (
    <Link
      className="flex hover:bg-background bg-card text-white p-4 rounded-lg overflow-hidden transition-all duration-300 ease-in-out w-full"
      to={`/sandboxes/${game.sandboxId}`}
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

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-xs uppercase font-light">
      <span className="text-gray-300">{title}</span>
    </h2>
  );
}

function BackgroundImage({ profile }: { profile: Profile }) {
  const offers = useMemo(
    () => profile.achievements.data?.map((achievement) => achievement.baseOfferForSandbox),
    [profile.achievements.data],
  );
  const randomOffer = useMemo(
    () => offers[Math.floor(Math.random() * (offers?.length ?? 0))],
    [offers],
  );

  return (
    <div
      className="absolute inset-0 w-full"
      style={{
        zIndex: -10,
      }}
    >
      <span
        className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background rounded-md h-[50vh] w-full"
        style={{
          zIndex: -1,
        }}
      />
      <img
        src={
          getImage(randomOffer?.keyImages ?? [], ['DieselStoreFrontWide', 'OfferImageWide'])?.url
        }
        alt={randomOffer?.id ?? ''}
        className="absolute inset-0 opacity-[0.25] z-0 w-full h-[50vh]"
        loading="lazy"
        style={{
          zIndex: -2,
          objectFit: 'cover',
          // Place the image as the top
          objectPosition: 'top',
        }}
      />
    </div>
  );
}

function LevelIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 25 25"
      className={cn('svg', className)}
      {...props}
    >
      <path
        d="M17.0208 2.24212C16.929 1.91929 16.3877 1.91929 16.2959 2.24212C16.0402 3.14058 15.6679 4.21937 15.2399 4.748C14.7655 5.33397 13.582 5.83545 12.6847 6.14986C12.385 6.25489 12.385 6.74511 12.6847 6.85014C13.582 7.16456 14.7655 7.66603 15.2399 8.252C15.6679 8.78063 16.0402 9.85942 16.2959 10.7579C16.3877 11.0807 16.929 11.0807 17.0208 10.7579C17.2765 9.85942 17.6488 8.78063 18.0768 8.252C18.5512 7.66603 19.7347 7.16456 20.632 6.85014C20.9317 6.74511 20.9317 6.25489 20.632 6.14986C19.7347 5.83544 18.5512 5.33397 18.0768 4.748C17.6488 4.21937 17.2765 3.14058 17.0208 2.24212ZM8.15377 7.54551C8.03104 7.09068 7.28574 7.09068 7.163 7.54551C6.71751 9.19641 6.00657 11.4072 5.17574 12.4335C4.27523 13.5458 1.91486 14.4841 0.317012 15.0195C-0.105671 15.1612 -0.105671 15.8388 0.317012 15.9805C1.91486 16.5159 4.27523 17.4542 5.17574 18.5665C6.00657 19.5928 6.71751 21.8036 7.163 23.4545C7.28574 23.9093 8.03104 23.9093 8.15377 23.4545C8.59926 21.8036 9.31021 19.5928 10.141 18.5665C11.0415 17.4542 13.4019 16.5159 14.9998 15.9805C15.4224 15.8388 15.4224 15.1612 14.9998 15.0195C13.4019 14.4841 11.0415 13.5458 10.141 12.4335C9.31021 11.4072 8.59926 9.19641 8.15377 7.54551Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function EpicTrophyIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 15 14"
      className={cn('svg', className)}
      {...props}
    >
      <path
        d="M1.78952 1.03177H3.21722C3.21547 1.05694 3.21455 1.08267 3.21455 1.10896L3.21455 2.21484H1.92245V3.65386C1.92245 4.29719 2.17572 4.91418 2.62655 5.36908C2.8022 5.54633 3.00223 5.69331 3.21869 5.8067C3.23933 6.28339 3.33644 6.74005 3.49797 7.16449C2.85933 7.01104 2.26929 6.68172 1.7975 6.20565C1.1268 5.52887 0.75 4.61096 0.75 3.65386V2.0807C0.75 1.50139 1.21541 1.03177 1.78952 1.03177Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path
        d="M4.57719 7.26263C4.37731 6.90243 4.24094 6.50149 4.18336 6.07526L4.17941 6.04498C4.16166 5.90411 4.15251 5.76052 4.15251 5.61478L4.15251 1.10896C4.15251 1.02488 4.24618 0.944783 4.41557 0.871928C4.92375 0.653363 6.11342 0.5 7.49999 0.5C9.34874 0.5 10.8475 0.772637 10.8475 1.10895V5.61478C10.8475 5.77097 10.837 5.9247 10.8166 6.07526C10.7459 6.59904 10.5561 7.0846 10.2758 7.50333C9.6742 8.40183 8.65546 8.99257 7.49999 8.99257L7.47834 8.9925C6.23167 8.98454 5.14668 8.28891 4.57719 7.26263Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path
        d="M11.502 7.1645C11.6635 6.74006 11.7606 6.2834 11.7813 5.80672C11.9978 5.69332 12.1978 5.54634 12.3735 5.36908C12.8243 4.91418 13.0775 4.29719 13.0775 3.65386V2.21484H11.8227V1.03177H13.2105C13.7846 1.03177 14.25 1.50139 14.25 2.0807V3.65386C14.25 4.61096 13.8732 5.52887 13.2025 6.20565C12.83 6.58157 12.3836 6.866 11.898 7.04457C11.7686 7.09215 11.6364 7.13221 11.502 7.1645Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path
        d="M10.3826 12.1379C10.3826 12.7521 9.09198 13.25 7.49998 13.25C5.90798 13.25 4.6174 12.7521 4.6174 12.1379C4.6174 11.9371 4.75526 11.7488 4.99644 11.5862L4.99892 11.5845L5.54498 11.2735C6.0756 10.9712 6.51643 10.5312 6.82173 9.99911C6.90651 9.85135 7.12539 9.74247 7.49998 9.74247C7.87457 9.74247 8.09345 9.85135 8.17823 9.99911C8.48353 10.5312 8.92435 10.9712 9.45498 11.2735L10.001 11.5845L10.008 11.5893C10.2464 11.7511 10.3826 11.9384 10.3826 12.1379Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function EpicPlatinumIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 10 15"
      className={cn('svg', className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.82469 5.7203C8.10017 4.28067 7.34052 2.77122 7.51834 0C6.90611 0.01125 4.43223 1.59312 3.97056 5.34875C3.48704 4.8144 3.24026 3.04552 3.33333 2.32187C1.13777 4.1775 0 6.56 0 9.21813C0 12.4019 1.90556 15 4.97945 15C8.05804 15 10 12.6544 10 9.8275C10 8.05565 9.42438 6.91189 8.82469 5.7203ZM4.99966 13.9598C5.83378 13.9598 6.50997 13.5934 6.50997 13.1415C6.50997 12.8016 6.12752 12.5101 5.58307 12.3865C5.44824 12.0795 5.37724 11.746 5.37724 11.4062C5.37724 11.3212 5.38389 11.237 5.39689 11.1541C6.45872 10.9664 7.2652 10.0392 7.2652 8.92337V7.57032L7.26527 7.56325C7.26527 7.06278 6.25098 6.65707 4.9998 6.65707C3.74862 6.65707 2.73433 7.06278 2.73433 7.56325L2.73427 8.92337C2.73427 10.0391 3.54067 10.9663 4.60242 11.1541C4.61543 11.237 4.62209 11.3212 4.62209 11.4062C4.62209 11.746 4.55109 12.0795 4.41626 12.3865C3.8718 12.5101 3.48935 12.8016 3.48935 13.1415C3.48935 13.5934 4.16554 13.9598 4.99966 13.9598Z"
        fill="currentColor"
      />
    </svg>
  );
}
