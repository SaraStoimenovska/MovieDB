import { z } from "zod";
import { RATING_SCALE } from "@/shared/config/rating";
import { STORAGE_KEYS } from "@/shared/config/storage-keys";
import { mediaKeySchema } from "@/shared/lib/tmdb/schemas";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import { normalizeUserText } from "@/shared/utils/text";

export const REVIEWS_STORAGE_KEY = STORAGE_KEYS.reviews;
export const REVIEWS_VERSION = 1;

export const REVIEW_LIMITS = {
  ratingMin: RATING_SCALE.min,
  ratingMax: RATING_SCALE.max,
  authorMax: 40,
  titleMax: 120,
  bodyMin: 10,
  bodyMax: 4000,
} as const;

export type ReviewId = string;

export type Review = {
  readonly id: ReviewId;
  readonly mediaKey: MediaKey;
  readonly author: string;
  /** 1–10, same scale as TMDB. */
  readonly rating: number;
  readonly title: string;
  readonly body: string;
  readonly createdAt: number;
  readonly updatedAt: number;
};

export type ReviewsData = {
  readonly byMedia: Readonly<Record<MediaKey, ReadonlyArray<Review>>>;
};

export const EMPTY_REVIEWS: ReviewsData = { byMedia: {} };

// ===================== Input (form + store share one schema) =====================

const trimmed = (max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().max(max, `Keep it under ${max} characters.`));

export const reviewInputSchema = z.object({
  author: trimmed(REVIEW_LIMITS.authorMax).pipe(z.string().min(1, "Please add your name.")),
  rating: z.coerce
    .number<number>()
    .int()
    .min(REVIEW_LIMITS.ratingMin, "Pick a rating.")
    .max(REVIEW_LIMITS.ratingMax),
  title: trimmed(REVIEW_LIMITS.titleMax),
  body: z
    .string()
    .transform(normalizeUserText)
    .pipe(
      z
        .string()
        .min(REVIEW_LIMITS.bodyMin, `Write at least ${REVIEW_LIMITS.bodyMin} characters.`)
        .max(REVIEW_LIMITS.bodyMax, `Keep it under ${REVIEW_LIMITS.bodyMax} characters.`),
    ),
});

/** What the form edits (raw) and what the store receives (validated, normalized). */
export type ReviewFormValues = z.input<typeof reviewInputSchema>;
export type ReviewInput = z.output<typeof reviewInputSchema>;

// ===================== Persisted schema =====================

const reviewSchema = z.object({
  id: z.string().min(1),
  mediaKey: mediaKeySchema,
  author: z.string().max(REVIEW_LIMITS.authorMax),
  rating: z.number().int().min(REVIEW_LIMITS.ratingMin).max(REVIEW_LIMITS.ratingMax),
  title: z.string().max(REVIEW_LIMITS.titleMax),
  body: z.string().max(REVIEW_LIMITS.bodyMax),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const reviewsDataSchema: z.ZodType<ReviewsData> = z.object({
  byMedia: z.record(mediaKeySchema, z.array(reviewSchema)),
});

// ===================== Reducers =====================

const setMediaReviews = (
  data: ReviewsData,
  mediaKey: MediaKey,
  reviews: ReadonlyArray<Review>,
): ReviewsData => {
  if (reviews.length > 0) return { byMedia: { ...data.byMedia, [mediaKey]: reviews } };
  const { [mediaKey]: _removed, ...rest } = data.byMedia;
  return { byMedia: rest };
};

/** `id` and `now` are passed in, keeping the reducer pure (the store generates them). */
export const addReview = (
  data: ReviewsData,
  mediaKey: MediaKey,
  input: ReviewInput,
  id: ReviewId,
  now: number,
): ReviewsData =>
  setMediaReviews(data, mediaKey, [
    ...(data.byMedia[mediaKey] ?? []),
    { id, mediaKey, ...input, createdAt: now, updatedAt: now },
  ]);

export const updateReview = (
  data: ReviewsData,
  mediaKey: MediaKey,
  id: ReviewId,
  input: ReviewInput,
  now: number,
): ReviewsData =>
  setMediaReviews(
    data,
    mediaKey,
    (data.byMedia[mediaKey] ?? []).map((review) =>
      review.id === id ? { ...review, ...input, updatedAt: now } : review,
    ),
  );

export const deleteReview = (data: ReviewsData, mediaKey: MediaKey, id: ReviewId): ReviewsData =>
  setMediaReviews(
    data,
    mediaKey,
    (data.byMedia[mediaKey] ?? []).filter((review) => review.id !== id),
  );

// ===================== Selectors =====================

const EMPTY_LIST: ReadonlyArray<Review> = [];

/** Newest first. Stable empty array so selectors don't cause re-renders. */
export const selectReviews = (data: ReviewsData, mediaKey: MediaKey): ReadonlyArray<Review> =>
  data.byMedia[mediaKey] ?? EMPTY_LIST;

export const sortNewestFirst = (reviews: ReadonlyArray<Review>): ReadonlyArray<Review> =>
  reviews.toSorted((a, b) => b.createdAt - a.createdAt);

/** Mean rating rounded to one decimal, or null without reviews. */
export const averageRating = (reviews: ReadonlyArray<Pick<Review, "rating">>): number | null =>
  reviews.length === 0
    ? null
    : Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) /
      10;

export const toFormValues = (review: Review): ReviewFormValues => ({
  author: review.author,
  rating: review.rating,
  title: review.title,
  body: review.body,
});

export const emptyFormValues = (author: string): ReviewFormValues => ({
  author,
  rating: 0,
  title: "",
  body: "",
});
