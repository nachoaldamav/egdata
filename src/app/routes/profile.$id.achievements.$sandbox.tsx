import { type LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { FlippableCard } from '~/components/app/achievement-card';
import { Button } from '~/components/ui/button';
import { getQueryClient } from '~/lib/client';
import { httpClient } from '~/lib/http-client';
import { SingleOffer } from '~/types/single-offer';

interface Root {
  playerAchievements: PlayerAchievement[];
  sandboxAchievements: SandboxAchievement[];
}

interface PlayerAchievement {
  _id: string;
  epicAccountId: string;
  sandboxId: string;
  totalXP: number;
  totalUnlocked: number;
  achievementSets: AchievementSet[];
  playerAwards: any[];
  playerAchievements: PlayerAchievement2[];
}

interface AchievementSet {
  achievementSetId: string;
  isBase: boolean;
  totalUnlocked: number;
  totalXP: number;
}

interface PlayerAchievement2 {
  playerAchievement: PlayerAchievement3;
}

interface PlayerAchievement3 {
  achievementName: string;
  epicAccountId: string;
  progress: number;
  sandboxId: string;
  unlocked: boolean;
  unlockDate: string;
  XP: number;
  achievementSetId: string;
  isBase: boolean;
}

interface SandboxAchievement {
  _id: string;
  productId: string;
  sandboxId: string;
  achievementSetId: string;
  isBase: boolean;
  numProgressed: number;
  numCompleted: number;
  achievements: Achievement[];
  __v: number;
}

interface Achievement {
  deploymentId: string;
  name: string;
  flavorText: string;
  hidden: boolean;
  unlockedDisplayName: string;
  unlockedDescription: string;
  unlockedIconId: string;
  unlockedIconLink: string;
  lockedDisplayName: string;
  lockedDescription: string;
  lockedIconId: string;
  lockedIconLink: string;
  xp: number;
  completedPercent: number;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const queryClient = getQueryClient();

  if (!params.id || !params.sandbox) {
    return redirect('/');
  }

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['player-sandbox-achievements', { id: params.id, sandbox: params.sandbox }],
      queryFn: () => httpClient.get<Root>(`/profiles/${params.id}/achievements/${params.sandbox}`),
    }),
    queryClient.prefetchQuery({
      queryKey: ['sandbox:base', { id: params.sandbox, country: 'US' }],
      queryFn: () =>
        httpClient.get<SingleOffer>(`/sandboxes/${params.sandbox}/base-game`, {
          params: {
            country: 'US',
          },
        }),
    }),
  ]);

  return {
    id: params.id,
    sandbox: params.sandbox,
    dehydratedState: dehydrate(queryClient),
  };
}

export default function Index() {
  const { dehydratedState } = useLoaderData<typeof loader>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <PlayerSandboxAchievementsPage />
    </HydrationBoundary>
  );
}

interface PlayerAchievementStatus extends Achievement {
  unlocked: boolean;
  unlockDate: string;
}

function PlayerSandboxAchievementsPage() {
  const { id, sandbox } = useLoaderData<typeof loader>();
  const { data, isLoading } = useQuery({
    queryKey: ['player-sandbox-achievements', { id, sandbox }],
    queryFn: () => httpClient.get<Root>(`/profiles/${id}/achievements/${sandbox}`),
  });
  const { data: offer, isLoading: isLoadingOffer } = useQuery({
    queryKey: ['sandbox:base', { id: sandbox, country: 'US' }],
    queryFn: () =>
      httpClient.get<SingleOffer>(`/sandboxes/${sandbox}/base-game`, {
        params: {
          country: 'US',
        },
      }),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Profile not found</div>;
  }

  const sandboxAchievements = data.sandboxAchievements
    .flatMap((achievementSet) => achievementSet.achievements)
    .flat();

  const playerAchievements = data.playerAchievements
    .flatMap((playerAchievement) => playerAchievement.playerAchievements)
    .flat();

  // Merge achievements, we know if its unlocked from the playerAchievements, while the sandboxAchievements has the data
  const achievements: PlayerAchievementStatus[] = sandboxAchievements.map((achievement) => {
    const playerAchievement = playerAchievements.find(
      ({ playerAchievement }) => playerAchievement.achievementName === achievement.name,
    );

    return {
      ...achievement,
      unlocked: playerAchievement?.playerAchievement.unlocked ?? false,
      unlockDate: playerAchievement?.playerAchievement.unlockDate ?? '',
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-full justify-start items-center gap-4 relative">
        <h1 className="text-2xl font-light">Achievements</h1>
        <span className="text-gray-600 text-xl">|</span>
        {offer?.title && <h4 className="text-2xl font-extrabold">{offer.title}</h4>}
        <span className="absolute top-0 right-0">
          <Button asChild variant={'outline'}>
            <Link to={`/profile/${id}`}>
              User Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mt-4">
        {achievements
          .sort((a, b) => (a.unlocked ? 1 : b.unlocked ? -1 : 0))
          .map((achievement, index) => (
            <FlippableCard
              key={achievement.name}
              achievement={achievement}
              flipAll={false}
              index={index}
              flipped={achievement.unlocked}
              onCardFlip={() => {}}
            />
          ))}
      </div>
    </div>
  );
}