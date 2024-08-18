import type { DiscordUser } from '~/app/services/auth.server';

export interface SingleReview {
  id: string;
  userId: string;
  user: DiscordUser;
  rating: number;
  recommended: boolean;
  content: string;
  title: string;
  tags: string[];
  createdAt: Date;
  verified: boolean;
  updatedAt: Date;
  editions?: {
    title: string;
    content: string;
    createdAt: Date;
    rating: number;
    tags: string[];
  }[];
}

export type ReviewInput = Omit<
  SingleReview,
  'id' | 'createdAt' | 'updatedAt' | 'verified' | 'userId' | 'editions'
>;
