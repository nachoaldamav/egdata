import { httpClient } from '~/lib/http-client';
import type { Avatar, LinkedAccount } from '~/types/profiles';

export const getUserInformation = async (id: string) => {
  const res = await httpClient.get<{
    epicAccountId: string;
    displayName: string;
    avatar: Avatar;
    stats: {
      totalGames: number;
      totalAchievements: number;
      totalPlayerAwards: number;
      reviewsCount: number;
      totalXP: number;
    };
    linkedAccounts?: LinkedAccount[];
    creationDate: string | null;
  }>(`/profiles/${id}/information`);
  return res;
};

export const getUserGames = async (id: string, page: number, limit: number) => {
  const res = await httpClient.get<{
    achievements: Array<{
      playerAwards: Array<{
        awardType: string;
        unlockedDateTime: string;
        achievementSetId: string;
      }>;
      totalXP: number;
      totalUnlocked: number;
      sandboxId: string;
      baseOfferForSandbox: {
        id: string;
        namespace: string;
        keyImages: Array<{
          type: string;
          url: string;
          md5: string;
        }>;
      };
      product: {
        name: string;
        slug?: string;
      };
      productAchievements: {
        totalAchievements: number;
        totalProductXP: number;
      };
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(`/profiles/${id}/games`, {
    params: {
      page,
      limit,
    },
  });
  return res;
};
