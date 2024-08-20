import type { LoaderFunctionArgs, ActionFunctionArgs, LinksFunction } from '@remix-run/node';
import { redirect, useLoaderData, Form, useActionData, json } from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQueries } from '@tanstack/react-query';
import { ChevronDown, ThumbsDown, ThumbsUp, ThumbsUpIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as Portal from '@radix-ui/react-portal';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { getQueryClient } from '~/lib/client';
import { httpClient } from '~/lib/http-client';
import type { ReviewInput, SingleReview } from '~/types/reviews';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { authenticator } from '../services/auth.server';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Slider } from '~/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { ReloadIcon } from '@radix-ui/react-icons';
import { cn } from '~/lib/utils';
import {
  Select,
  SelectContent,
  SelectValue,
  SelectItem,
  SelectTrigger,
} from '~/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area';
import type { SingleOffer } from '~/types/single-offer';
import { ClientOnly } from 'remix-utils/client-only';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
} from '@mdxeditor/editor';
import Markdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import '@mdxeditor/editor/style.css';
import MdxEditorCss from '@mdxeditor/editor/style.css?url';
import '../../mdx-editor.css';

type ReviewSummary = {
  overallScore: number;
  recommendedPercentage: number;
  notRecommendedPercentage: number;
  totalReviews: number;
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: MdxEditorCss }];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const queryClient = getQueryClient();

  const user = await authenticator.isAuthenticated(request).catch(() => null);

  if (!params.id) {
    return redirect('/');
  }

  const [, , userCanReview] = await Promise.all([
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
      queryFn: () => httpClient.get<ReviewSummary>(`/offers/${params.id}/reviews-summary`),
    }),
    httpClient
      .get<{
        canReview: boolean;
      }>(`/offers/${params.id}/reviews/permissions`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
        retries: 1,
      })
      .catch((error) => {
        return null;
      }),
  ]);

  return {
    dehydratedState: dehydrate(queryClient),
    id: params.id,
    userId: user?.id,
    userCanReview: userCanReview
      ? {
          status: userCanReview.canReview,
          label: 'Already reviewed',
        }
      : {
          status: false,
          label: 'Login to review',
        },
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const actionType = request.method as 'POST' | 'PATCH' | 'DELETE';
  const user = await authenticator.isAuthenticated(request);

  if (!user) {
    return redirect('/login');
  }

  const formData = await request.formData();

  const honeyPot = formData.get('website') as string;

  if (typeof honeyPot === 'string' && honeyPot !== '') {
    console.error('Spam detected', honeyPot);
    return json({
      success: false,
      errors: { general: 'An error occurred while submitting review' } as Record<string, string>,
    });
  }

  if (actionType === 'POST') {
    const errors: Record<string, string> = {};

    console.log(formData);
    const rating = Number(formData.get('rating'));
    const recommended = formData.get('recommended') === 'true';
    const content = formData.get('content') as string;
    const title = formData.get('title') as string;
    const tags = (formData.get('tags') as string)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter((tag) => tag.length > 0);

    if (!title) errors.title = 'Title is required';

    if (title.length < 3) errors.title = 'Title must be at least 3 characters long';

    if (title.length > 200) errors.title = 'Title must be less than 200 characters long';

    if (!content) errors.content = 'Content is required';

    if (content.length < 3) errors.content = 'Content must be at least 3 characters long';

    if (content.length > 50_000)
      errors.content = 'Content must be less than 50,000 characters long';

    if (rating < 1 || rating > 10) errors.rating = 'Rating must be between 1 and 10';

    if (Object.keys(errors).length) {
      return json({ errors, success: false }, { status: 400 });
    }

    const body: ReviewInput = {
      rating,
      recommended,
      content,
      title,
      tags,
    };

    const res = await httpClient
      .post(`/offers/${params.id}/reviews`, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        retries: 1,
      })
      .catch((error) => {
        console.error('Error submitting review');
        return null;
      });

    if (!res) {
      errors.general = 'An error occurred while submitting review';
      return json({
        success: false,
        errors,
      });
    }

    console.log('Submitted review', body);

    return json({ success: true, errors: null });
  }

  if (actionType === 'PATCH') {
    // Handle form submission
    const errors: Record<string, string> = {};

    const rating = Number(formData.get('rating'));
    const recommended = formData.get('recommended') === 'true';
    const content = formData.get('content') as string;
    const title = formData.get('title') as string;
    const tags = (formData.get('tags') as string)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter((tag) => tag.length > 0);

    if (!title) errors.title = 'Title is required';

    if (title.length < 3) errors.title = 'Title must be at least 3 characters long';

    if (!content) errors.content = 'Content is required';

    if (content.length < 3) errors.content = 'Content must be at least 3 characters long';

    if (rating < 0 || rating > 10) errors.rating = 'Rating must be between 0 and 10';

    if (Object.keys(errors).length) {
      return json({ errors, success: false }, { status: 400 });
    }

    const body: ReviewInput = {
      rating,
      recommended,
      content,
      title,
      tags,
    };

    const res = await httpClient
      .patch(`/offers/${params.id}/reviews`, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        retries: 1,
      })
      .catch((error) => {
        console.error('Error submitting review');
        return null;
      });

    if (!res) {
      errors.general = 'An error occurred while submitting review';
      return json({
        success: false,
        errors,
      });
    }

    console.log('Submitted review', body);

    return json({ success: true, errors: null });
  }

  if (actionType === 'DELETE') {
    const errors: Record<string, string> = {};
    const res = await httpClient
      .delete(`/offers/${params.id}/reviews`, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        retries: 1,
      })
      .catch((error) => {
        console.error('Error deleting review');
        return null;
      });

    if (!res) {
      errors.general = 'An error occurred while deleting review';
      return json({
        success: false,
        errors,
      });
    }

    return json({ success: true, errors: null });
  }

  json({ success: true, errors: null });
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
  const { userCanReview } = useLoaderData<typeof loader>();
  const [page, setPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewsQuery, summaryQuery, offerQuery] = useQueries({
    queries: [
      {
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
      },
      {
        queryKey: [
          'reviews-summary',
          {
            id,
          },
        ],
        queryFn: () => httpClient.get<ReviewSummary>(`/offers/${id}/reviews-summary`),
      },
      {
        queryKey: ['offer', { id }],
        queryFn: () => httpClient.get<SingleOffer>(`/offers/${id}`),
      },
    ],
  });

  const reviews = reviewsQuery.data;
  const summary = summaryQuery.data;
  const offer = offerQuery.data;

  const isReleased = offer
    ? new Date(offer?.releaseDate || offer?.effectiveDate) < new Date()
    : false;

  return (
    <div className="grid gap-6 mx-auto mt-10">
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-between flex-row w-full h-32 gap-4">
            <Card className="w-full bg-card text-white h-32">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-evenly gap-4">
                  <div className="flex flex-col items-center sm:items-start">
                    <h2 className="text-lg font-semibold mb-1">Overall Score</h2>
                    <p className="text-4xl font-extrabold">{summary?.overallScore ?? '-'} / 10</p>
                  </div>
                  <div className="flex flex-col items-center justify-between gap-4">
                    <span className="text-sm">
                      Based on{' '}
                      {summary?.totalReviews.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}{' '}
                      reviews
                    </span>
                    <RecommendationBar
                      recommendedPercentage={summary?.recommendedPercentage ?? 0}
                      notRecommendedPercentage={summary?.notRecommendedPercentage ?? 0}
                      totalReviews={summary?.totalReviews ?? 0}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="w-fit flex flex-col items-start justify-center p-4 h-full gap-2 text-left">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Reviews" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="verified">Only Verified</SelectItem>
                  <SelectItem value="not-verified">Not Verified</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="text-sm w-full"
                onClick={() => setShowReviewForm((prev) => !prev)}
                disabled={!isReleased || !userCanReview.status}
              >
                {userCanReview.status ? 'Leave a review' : userCanReview.label}
              </Button>
            </Card>
          </div>
        </div>
        <p className="text-muted-foreground">Based on {summary?.totalReviews ?? '0'} reviews</p>
      </div>
      {reviews?.elements.length ? (
        <div className="grid gap-6 grid-cols-2">
          {reviews?.elements.map((review) => (
            <Review key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="w-full text-center min-h-[400px]">
          <h6 className="text-lg font-semibold">
            {/* No reviews yet */}
            {isReleased ? 'No reviews yet' : 'This product has not been released yet'}
          </h6>
          <p className="text-muted-foreground">
            {isReleased
              ? 'Be the first to leave a review for this product!'
              : 'Check back after the release date to leave a review!'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowReviewForm((prev) => !prev)}
            disabled={!isReleased || !userCanReview.status}
          >
            Leave a review
          </Button>
        </div>
      )}
      <Portal.Root>
        {showReviewForm && <ReviewForm setIsOpen={setShowReviewForm} offer={offer} />}
      </Portal.Root>
      <hr className="border-t border-gray-200/15 my-8" />
    </div>
  );
}

function Review({ review, full }: { review: SingleReview; full?: boolean }) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showFull, setShowFull] = useState(full);
  const { userId } = useLoaderData<typeof loader>();
  const userAvatar = URL.canParse(review.user.avatarUrl ?? '')
    ? review.user.avatarUrl
    : `https://cdn.discordapp.com/avatars/${review.user.id}/${review.user.avatarUrl}.png`;

  return (
    <div className="p-4 bg-card text-white rounded-lg max-w-2xl mx-auto w-full">
      <div className="flex items-center mb-4">
        <Avatar>
          <AvatarImage src={userAvatar as string} alt={review.user.displayName} />
          <AvatarFallback>{review.user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="ml-4 inline-flex items-center space-x-2">
          <div className="font-bold">{review.user.displayName}</div>
          {review.verified && <Badge variant="secondary">Verified Owner</Badge>}
        </div>
        <div className="ml-auto flex items-end space-x-2 bg-gray-900 px-2 py-1 rounded-lg">
          <div className=" text-white px-2 py-1 rounded-lg font-bold">{review.rating} / 10</div>
          <div className="flex items-center space-x-1 font-bold">
            <span>{review.recommended ? 'Recommended' : 'Not Recommended'}</span>
            <ThumbsUpIcon
              className={cn(
                'p-[4px] size-8',
                review.recommended ? 'fill-blue-600' : 'fill-red-600 transform rotate-180',
              )}
              stroke="none"
            />
          </div>
        </div>
      </div>
      <div className="bg-gray-900 p-4 rounded-lg">
        <h3 className="font-bold mb-2">{review.title}</h3>
        <div className="relative">
          <p className="mb-4 prose prose-sm prose-neutral dark:prose-invert max-w-none">
            <Markdown>
              {review.content.length <= 200 ? review.content : `${review.content.slice(0, 200)}...`}
            </Markdown>
          </p>
          {review.content.length > 200 && (
            <div className="absolute bottom-0 left-0 w-full">
              <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-b via-gray-900/50 from-transparent to-gray-900 pointer-events-none" />
              <Button
                variant="link"
                className="text-sm absolute z-10 -bottom-4 right-0 left-0 w-fit mx-auto inline-flex items-center gap-1 font-bold"
                onClick={() => setShowFull(true)}
              >
                <ChevronDown className="size-4" />
                Read more
                <ChevronDown className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="inline-flex justify-between items-center w-full">
        <div className="mt-4 inline-flex justify-between items-center w-full">
          <TooltipProvider>
            <Tooltip disableHoverableContent={!review.editions}>
              <TooltipTrigger>
                <span
                  className={cn(
                    'text-gray-400',
                    review.updatedAt !== review.createdAt
                      ? 'underline decoration-dotted cursor-pointer underline-offset-4'
                      : '',
                  )}
                >
                  Reviewed on{' '}
                  {new Date(review.createdAt).toLocaleDateString('en-UK', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-xs flex flex-col gap-1">
                  <span>
                    Last updated on{' '}
                    {new Date(review.updatedAt).toLocaleDateString('en-UK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </span>
                  {review.editions?.map((edition) => (
                    <span key={edition.createdAt as string}>
                      Updated on{' '}
                      {new Date(edition.createdAt).toLocaleDateString('en-UK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </span>
                  ))}
                </span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {userId === review.userId && (
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => setShowEditForm((prev) => !prev)}
            >
              Edit
            </Button>
          )}
        </div>
        {userId === review.userId && (
          <Portal.Root>
            {showEditForm && (
              <EditReviewForm
                setIsOpen={setShowEditForm}
                previousReview={review}
                offer={undefined}
              />
            )}
          </Portal.Root>
        )}
        <Portal.Root>
          {showFull && <FullReview review={review} setIsOpen={setShowFull} />}
        </Portal.Root>
      </div>
    </div>
  );
}

function FullReview({
  review,
  setIsOpen,
}: { review: SingleReview; setIsOpen: (isOpen: boolean) => void }) {
  const userAvatar = URL.canParse(review.user.avatarUrl ?? '')
    ? review.user.avatarUrl
    : `https://cdn.discordapp.com/avatars/${review.user.id}/${review.user.avatarUrl}.png`;
  return (
    <div className="fixed inset-0 h-full w-full flex items-center justify-center bg-black bg-opacity-50 z-20">
      <span
        className="fixed inset-0 cursor-pointer"
        onClick={() => setIsOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      />
      <div className="p-2 bg-card text-white rounded-lg max-w-2xl mx-auto w-full z-30">
        <div className="w-full  p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <Avatar>
              <AvatarImage src={userAvatar as string} alt={review.user.displayName} />
              <AvatarFallback>{review.user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="ml-4 inline-flex items-center space-x-2">
              <div className="font-bold">{review.user.displayName}</div>
              {review.verified && <Badge variant="secondary">Verified Owner</Badge>}
            </div>
            <div className="ml-auto flex items-end space-x-2 bg-gray-900 px-2 py-1 rounded-lg">
              <div className=" text-white px-2 py-1 rounded-lg font-bold">{review.rating} / 10</div>
              <div className="flex items-center space-x-1 font-bold">
                <span>{review.recommended ? 'Recommended' : 'Not Recommended'}</span>
                <ThumbsUpIcon
                  className={cn(
                    'p-[4px] size-8',
                    review.recommended ? 'fill-blue-600' : 'fill-red-600 transform rotate-180',
                  )}
                  stroke="none"
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="font-bold mb-2">{review.title}</h3>
            <div className="relative">
              <ScrollArea className="h-[50vh]">
                <p className="mb-4 prose prose-sm prose-neutral dark:prose-invert max-w-none mr-2">
                  <Markdown>{review.content}</Markdown>
                </p>
                <ScrollBar />
              </ScrollArea>
            </div>
          </div>
          <div className="mt-4 inline-flex justify-between items-center w-full">
            <span className="text-gray-400">
              Reviewed on{' '}
              {new Date(review.createdAt).toLocaleDateString('en-UK', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <Button variant="outline" className="text-sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationBar({
  recommendedPercentage,
  notRecommendedPercentage,
  totalReviews,
}: {
  recommendedPercentage: number;
  notRecommendedPercentage: number;
  totalReviews: number;
}) {
  const [hovered, setHovered] = useState<'recommended' | 'notRecommended' | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-1 font-bold">
          <ThumbsUp className="w-5 h-5 fill-blue-600" stroke="none" />
          {(hovered === 'notRecommended' || hovered === null) && (
            <span className="text-sm font-bold">{(recommendedPercentage ?? 0) * 100}%</span>
          )}
          {hovered === 'recommended' && (
            <span className="text-sm">
              {(recommendedPercentage * totalReviews).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{' '}
              review
              {totalReviews === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 font-bold">
          {hovered === 'notRecommended' && (
            <span className="text-sm">
              {(notRecommendedPercentage * totalReviews).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{' '}
              review
              {totalReviews === 1 ? '' : 's'}
            </span>
          )}
          {(hovered === 'recommended' || hovered === null) && (
            <span className="text-sm font-bold">{(notRecommendedPercentage ?? 0) * 100}%</span>
          )}
          <ThumbsDown className="w-5 h-5 fill-red-600" stroke="none" />
        </div>
      </div>
      <div className="flex h-[4px] w-[300px] overflow-hidden rounded-full gap-1">
        <div
          className={cn(
            'bg-blue-600 rounded-full transition-all duration-300 ease-in-out cursor-pointer',
            hovered === 'notRecommended' ? 'bg-opacity-50' : 'bg-opacity-100',
          )}
          style={{ width: `${(recommendedPercentage ?? 0) * 100}%` }}
          role="progressbar"
          aria-valuenow={(recommendedPercentage ?? 0) * 100}
          aria-valuemin={0}
          aria-valuemax={100}
          onMouseEnter={() => setHovered('recommended')}
          onMouseLeave={() => setHovered(null)}
        />
        <div
          className={cn(
            'bg-red-600 rounded-full transition-all duration-300 ease-in-out cursor-pointer',
            hovered === 'recommended' ? 'bg-opacity-50' : 'bg-opacity-100',
          )}
          style={{ width: `${(notRecommendedPercentage ?? 0) * 100}%` }}
          role="progressbar"
          aria-valuenow={(notRecommendedPercentage ?? 0) * 100}
          aria-valuemin={0}
          aria-valuemax={100}
          onMouseEnter={() => setHovered('notRecommended')}
          onMouseLeave={() => setHovered(null)}
        />
      </div>
    </div>
  );
}

interface ReviewFormProps {
  setIsOpen: (isOpen: boolean) => void;
  offer: SingleOffer | undefined;
}

function ReviewForm({ setIsOpen, offer }: ReviewFormProps) {
  const actionData = useActionData<typeof action>();
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState('Please enter your review here');

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

  useEffect(() => {
    if (typeof actionData?.success === 'boolean') {
      setIsSubmitting(false);
      if (actionData.success) {
        window.location.reload();
      }
    }
  }, [actionData]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: already handled */}
      <div className="fixed inset-0 cursor-pointer" onClick={() => setIsOpen(false)} />
      <Card className="w-full max-w-2xl z-20">
        <ScrollArea className="h-[60vh]">
          <CardHeader>
            <CardTitle>Submit a Review</CardTitle>
            <CardDescription>
              Share your thoughts about {offer?.title ?? 'the product'}
            </CardDescription>
          </CardHeader>
          <Form
            method="POST"
            onSubmit={() => {
              setIsSubmitting(true);
            }}
          >
            <input hidden name="website" placeholder="https://egdata.app" />
            <CardContent className="space-y-6">
              {actionData?.success && (
                <Alert>
                  <AlertDescription>Your review has been submitted successfully!</AlertDescription>
                </Alert>
              )}
              {actionData?.errors?.general && (
                <Alert variant="destructive">
                  <AlertDescription>{actionData.errors.general}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Slider
                  name="rating"
                  min={0}
                  max={10}
                  step={1}
                  value={[rating]}
                  onValueChange={(value) => setRating(value[0])}
                  className="w-full"
                />
                <div className="text-center font-bold">{rating} / 10</div>
                {actionData?.errors?.rating && (
                  <p className="text-sm text-red-500">{actionData.errors.rating}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Would you recommend this product?</Label>
                <RadioGroup name="recommended" defaultValue="true">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="yes" />
                    <Label htmlFor="yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="no" />
                    <Label htmlFor="no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter a title for your review"
                  required
                />
                {actionData?.errors?.title && (
                  <p className="text-sm text-red-500">{actionData.errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Review Content</Label>
                <ClientOnly fallback={<p>Loading...</p>}>
                  {() => (
                    <MDXEditor
                      markdown={content ?? ' '}
                      contentEditableClassName="text-white border border-primary/10 px-4 rounded-lg prose prose-sm prose-neutral dark:prose-invert w-full max-w-none min-h-[200px]"
                      className="dark-theme dark-editor"
                      plugins={[
                        headingsPlugin({
                          allowedHeadingLevels: [2, 3, 4],
                        }),
                        quotePlugin(),
                        listsPlugin(),
                        markdownShortcutPlugin(),
                      ]}
                      onChange={(value) => setContent(value)}
                    />
                  )}
                </ClientOnly>
                <textarea
                  hidden
                  id="content"
                  name="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                {actionData?.errors?.content && (
                  <p className="text-sm text-red-500">{actionData.errors.content}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" placeholder="e.g. quality, design, performance" />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <ReloadIcon className="animate-spin size-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </CardFooter>
          </Form>
        </ScrollArea>
      </Card>
    </div>
  );
}

interface EditReviewFormProps {
  setIsOpen: (isOpen: boolean) => void;
  previousReview: SingleReview;
  offer: SingleOffer | undefined;
}

function EditReviewForm({ setIsOpen, previousReview, offer }: EditReviewFormProps) {
  const actionData = useActionData<typeof action>();
  const [rating, setRating] = useState(previousReview.rating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState(previousReview.content);

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

  useEffect(() => {
    if (typeof actionData?.success === 'boolean') {
      setIsSubmitting(false);

      if (actionData.success) {
        window.location.reload();
      }
    }
  }, [actionData]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: already handled */}
      <div className="fixed inset-0 cursor-pointer" onClick={() => setIsOpen(false)} />
      <Card className="w-full max-w-2xl z-20 relative">
        <span className="absolute top-4 right-4 z-30">
          <Form method="DELETE" onSubmit={() => setIsSubmitting(true)}>
            <Button
              type="submit"
              variant="outline"
              className="text-sm border-destructive hover:bg-destructive hover:bg-opacity-10"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </Form>
        </span>
        <ScrollArea className="h-[60vh]">
          <CardHeader>
            <CardTitle>Edit Review</CardTitle>
            <CardDescription>
              Share your thoughts about {offer?.title ?? 'the product'}
            </CardDescription>
          </CardHeader>
          <Form
            method="PATCH"
            onSubmit={() => {
              setIsSubmitting(true);
            }}
          >
            <input hidden name="website" placeholder="https://egdata.app" />
            <CardContent className="space-y-6">
              {actionData?.success && (
                <Alert>
                  <AlertDescription>Your review has been submitted successfully!</AlertDescription>
                </Alert>
              )}
              {actionData?.errors?.general && (
                <Alert variant="destructive">
                  <AlertDescription>{actionData.errors.general}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Slider
                  name="rating"
                  min={0}
                  max={10}
                  step={1}
                  value={[rating]}
                  onValueChange={(value) => setRating(value[0])}
                  className="w-full"
                />
                <div className="text-center font-bold">{rating} / 10</div>
                {actionData?.errors?.rating && (
                  <p className="text-sm text-red-500">{actionData.errors.rating}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Would you recommend this product?</Label>
                <RadioGroup
                  name="recommended"
                  defaultValue={previousReview.recommended ? 'true' : 'false'}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="yes" />
                    <Label htmlFor="yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="no" />
                    <Label htmlFor="no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={previousReview.title}
                  placeholder="Enter a title for your review"
                  required
                />
                {actionData?.errors?.title && (
                  <p className="text-sm text-red-500">{actionData.errors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Review Content</Label>
                <ClientOnly fallback={<p>Loading...</p>}>
                  {() => (
                    <MDXEditor
                      markdown={content ?? ' '}
                      className="dark-theme dark-editor"
                      contentEditableClassName="text-white border border-primary/10 px-4 rounded-lg prose prose-sm prose-neutral dark:prose-invert w-full max-w-none min-h-[200px]"
                      plugins={[
                        headingsPlugin({
                          allowedHeadingLevels: [2, 3, 4],
                        }),
                        quotePlugin(),
                        listsPlugin(),
                        markdownShortcutPlugin(),
                      ]}
                      onChange={(value) => setContent(value)}
                    />
                  )}
                </ClientOnly>
                <textarea
                  hidden
                  id="content"
                  name="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                {actionData?.errors?.content && (
                  <p className="text-sm text-red-500">{actionData.errors.content}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={previousReview.tags.join(', ')}
                  placeholder="e.g. quality, design, performance"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-row justify-between gap-2">
              <Button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <ReloadIcon className="animate-spin size-4" />}
                {isSubmitting ? 'Submitting...' : 'Update Review'}
              </Button>
            </CardFooter>
          </Form>
        </ScrollArea>
      </Card>
    </div>
  );
}
