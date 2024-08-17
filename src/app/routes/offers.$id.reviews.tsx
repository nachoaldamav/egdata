import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { redirect, useLoaderData, Form } from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { CircleIcon, StarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as Portal from '@radix-ui/react-portal';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { getQueryClient } from '~/lib/client';
import { httpClient } from '~/lib/http-client';
import type { SingleReview } from '~/types/reviews';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { authenticator } from '../services/auth.server';
import { cn } from '~/lib/utils';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const queryClient = getQueryClient();

  if (!params.id) {
    return redirect('/');
  }

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: [
        'reviews',
        {
          id: params.id,
          page: 1,
        },
      ],
      queryFn: () =>
        httpClient.get<{
          elements: Array<SingleReview>;
          page: number;
          total: number;
          limit: number;
        }>(`/offers/${params.id}/reviews`, {
          params: {
            page: 1,
          },
        }),
    }),
    queryClient.prefetchQuery({
      queryKey: [
        'reviews-summary',
        {
          id: params.id,
        },
      ],
      queryFn: () =>
        httpClient.get<{
          totalReviews: number;
          averageRating: number;
        }>(`/offers/${params.id}/reviews-summary`),
    }),
  ]);

  return {
    dehydratedState: dehydrate(queryClient),
    id: params.id,
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const actionType = request.method as 'POST' | 'PUT' | 'DELETE';
  const user = await authenticator.isAuthenticated(request);

  if (!user) {
    return redirect('/login');
  }

  if (actionType === 'POST') {
    // Handle form submission
    const rawBody = await request.formData();

    console.log(rawBody);

    const body: Omit<SingleReview, 'id' | 'createdAt' | 'verified' | 'userId'> = {
      title: rawBody.get('title') as string,
      content: rawBody.get('content') as string,
      rating: Number(rawBody.get('rating')),
      tags: (rawBody.get('tags') as string).split(',').map((tag) => tag.trim()),
    };

    const res = await httpClient.post(`/offers/${params.id}/reviews`, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      retries: 1,
    });

    return redirect(`/offers/${params.id}/reviews`);
  }

  if (actionType === 'PUT') {
    // Handle form submission
  }

  if (actionType === 'DELETE') {
    // Handle form submission
  }
};

export default function Index() {
  const { dehydratedState, id } = useLoaderData<typeof loader>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <ReviewsPage id={id} />
    </HydrationBoundary>
  );
}

function ReviewsPage({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { data: reviews } = useQuery({
    queryKey: [
      'reviews',
      {
        id,
        page,
      },
    ],
    queryFn: () =>
      httpClient.get<{ elements: SingleReview[]; page: number; total: number }>(
        `/offers/${id}/reviews`,
        { params: { page } },
      ),
  });
  const { data: summary } = useQuery<{
    totalReviews: number;
    averageRating: number;
  }>({
    queryKey: [
      'reviews-summary',
      {
        id,
      },
    ],
    queryFn: () =>
      httpClient.get<{ totalReviews: number; averageRating: number }>(
        `/offers/${id}/reviews-summary`,
      ),
  });

  return (
    <div className="grid gap-6 mx-auto mt-10">
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-between flex-row w-full">
            <div className="inline-flex justify-between items-center gap-4">
              <h2 className="text-2xl font-semibold">Customer Reviews</h2>
              <Badge variant="secondary" className="text-xs inline-flex items-center gap-1">
                {summary?.averageRating ?? 'N/A'} <StarIcon className="w-4 h-4 fill-current" />
              </Badge>
            </div>
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => setShowReviewForm((prev) => !prev)}
            >
              Leave a review
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">Based on {summary?.totalReviews ?? '0'} reviews</p>
      </div>
      {reviews?.elements.length ? (
        <div className="grid gap-6">
          {reviews?.elements.map((review) => (
            <Review key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="w-full text-center">
          <h6 className="text-lg font-semibold">No reviews yet</h6>
          <p className="text-muted-foreground">Be the first to leave a review</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowReviewForm((prev) => !prev)}
          >
            Leave a review
          </Button>
        </div>
      )}
      <Portal.Root>
        {showReviewForm && (
          <ReviewForm isOpen={showReviewForm} setIsOpen={setShowReviewForm} id={id} />
        )}
      </Portal.Root>
    </div>
  );
}

function Review({ review }: { review: SingleReview }) {
  return (
    <Card className="grid gap-4 p-4">
      <div className="flex gap-2 justify-start items-center">
        <div className="font-semibold">{review.userId}</div>
        <Badge variant="secondary" className="text-xs">
          {review.verified ? 'Verified Owner' : 'Unknown'}
        </Badge>
        <span className="text-xl font-semibold">/</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <StarIcon
              key={index}
              className={`w-5 h-5 ${
                index < review.rating ? 'fill-primary' : 'fill-muted stroke-muted-foreground'
              }`}
            />
          ))}
        </div>
      </div>
      <h5 className="text-lg font-semibold">{review.title}</h5>

      <p className="text-muted-foreground">{review.content}</p>
    </Card>
  );
}

function ReviewForm({
  isOpen,
  setIsOpen,
  id,
}: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void; id: string }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setIsOpen]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: already handled */}
      <div className="fixed inset-0 cursor-pointer" onClick={() => setIsOpen(false)} />
      <Card className="w-full max-w-lg z-20">
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
          <CardDescription>Share your thoughts about this product.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="POST" action={`/offers/${id}/reviews`} className="grid gap-4">
            <Input
              placeholder="Title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
            />
            <Textarea
              placeholder="Write your review here..."
              rows={4}
              className="resize-none"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={cn(
                      'w-6 h-6 cursor-pointer',
                      star <= rating ? 'fill-primary' : 'fill-muted stroke-muted-foreground',
                      'hover:fill-primary hover:stroke-primary',
                    )}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
              <input type="hidden" name="rating" value={rating} required />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Add tags... (comma separated)"
                className="flex-wrap"
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <CircleIcon className="animate-spin w-5 h-5 mr-2" />}
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
