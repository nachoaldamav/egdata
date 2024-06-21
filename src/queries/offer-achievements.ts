import { client } from '~/lib/client';

export type AchievementsSets = AchievementSet[];

export interface AchievementSet {
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

export interface Achievement {
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

export async function fetchAchievementsSets({ id }: { id: string }) {
  return client.get<AchievementsSets>(`/offers/${id}/achievements`).then((res) => res.data);
}
