export interface SingleReview {
  id: string;
  userId: string;
  rating: number;
  content: string;
  title: string;
  tags: string[];
  createdAt: Date;
  verified: boolean;
}
