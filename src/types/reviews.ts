import type { EpicUser } from '~/app/services/auth.server';

export interface SingleReview {
  id: string;
  userId: string;
  user: EpicUser & {
    avatarUrl?: {
      variants: string[];
    };
  };
  rating: number;
  recommended: boolean;
  content: string;
  title: string;
  tags: string[];
  createdAt: string;
  verified: boolean;
  updatedAt: string;
  editions?: {
    title: string;
    content: string;
    createdAt: string;
    rating: number;
    tags: string[];
  }[];
}

export type ReviewInput = Omit<
  SingleReview,
  'id' | 'createdAt' | 'updatedAt' | 'verified' | 'userId' | 'editions' | 'user'
>;
