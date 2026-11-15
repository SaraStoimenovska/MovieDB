import { z } from "zod";
import { STORAGE_KEYS } from "@/shared/config/storage-keys";
import { normalizeUserText } from "@/shared/utils/text";
import { REVIEW_LIMITS, type ReviewId } from "./reviews";

export const COMMENTS_STORAGE_KEY = STORAGE_KEYS.comments;
export const COMMENTS_VERSION = 1;

export const COMMENT_LIMITS = { bodyMax: 1000 } as const;

/** Replies nest visually up to this depth; deeper replies attach at the last level. */
export const MAX_THREAD_DEPTH = 3;

export type CommentId = string;

export type Comment = {
  readonly id: CommentId;
  readonly reviewId: ReviewId;
  readonly parentId: CommentId | null;
  readonly author: string;
  readonly body: string;
  /** Soft-deleted comments keep their place so replies under them stay readable. */
  readonly deleted: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
};

export type CommentsData = {
  readonly byReview: Readonly<Record<ReviewId, ReadonlyArray<Comment>>>;
};

export const EMPTY_COMMENTS: CommentsData = { byReview: {} };

export const commentInputSchema = z.object({
  author: z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1, "Please add your name.").max(REVIEW_LIMITS.authorMax)),
  body: z
    .string()
    .transform(normalizeUserText)
    .pipe(
      z
        .string()
        .min(1, "Write a comment first.")
        .max(COMMENT_LIMITS.bodyMax, `Keep it under ${COMMENT_LIMITS.bodyMax} characters.`),
    ),
});

export type CommentFormValues = z.input<typeof commentInputSchema>;
export type CommentInput = z.output<typeof commentInputSchema>;

const commentSchema = z.object({
  id: z.string().min(1),
  reviewId: z.string().min(1),
  parentId: z.string().nullable(),
  author: z.string().max(REVIEW_LIMITS.authorMax),
  body: z.string().max(COMMENT_LIMITS.bodyMax),
  deleted: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const commentsDataSchema: z.ZodType<CommentsData> = z.object({
  byReview: z.record(z.string(), z.array(commentSchema)),
});

// ===================== Reducers =====================

const setReviewComments = (
  data: CommentsData,
  reviewId: ReviewId,
  comments: ReadonlyArray<Comment>,
): CommentsData => {
  if (comments.length > 0) return { byReview: { ...data.byReview, [reviewId]: comments } };
  const { [reviewId]: _removed, ...rest } = data.byReview;
  return { byReview: rest };
};

const listFor = (data: CommentsData, reviewId: ReviewId): ReadonlyArray<Comment> =>
  data.byReview[reviewId] ?? [];

export const addComment = (
  data: CommentsData,
  reviewId: ReviewId,
  parentId: CommentId | null,
  input: CommentInput,
  id: CommentId,
  now: number,
): CommentsData =>
  setReviewComments(data, reviewId, [
    ...listFor(data, reviewId),
    { id, reviewId, parentId, ...input, deleted: false, createdAt: now, updatedAt: now },
  ]);

export const editComment = (
  data: CommentsData,
  reviewId: ReviewId,
  id: CommentId,
  body: string,
  now: number,
): CommentsData =>
  setReviewComments(
    data,
    reviewId,
    listFor(data, reviewId).map((comment) =>
      comment.id === id && !comment.deleted ? { ...comment, body, updatedAt: now } : comment,
    ),
  );

/** Drops soft-deleted comments that no longer have any (live or deleted) replies, repeatedly. */
const pruneDeletedLeaves = (comments: ReadonlyArray<Comment>): ReadonlyArray<Comment> => {
  const parentIds = new Set(comments.map((comment) => comment.parentId));
  const pruned = comments.filter((comment) => !comment.deleted || parentIds.has(comment.id));
  return pruned.length === comments.length ? comments : pruneDeletedLeaves(pruned);
};

/**
 * A comment with replies becomes "[deleted]" (text removed, replies kept); a leaf is removed.
 * Deleted parents left without replies disappear too.
 */
export const deleteComment = (
  data: CommentsData,
  reviewId: ReviewId,
  id: CommentId,
  now: number,
): CommentsData =>
  setReviewComments(
    data,
    reviewId,
    pruneDeletedLeaves(
      listFor(data, reviewId).map((comment) =>
        comment.id === id ? { ...comment, body: "", deleted: true, updatedAt: now } : comment,
      ),
    ),
  );

/** Cascade when a review is deleted. */
export const removeReviewComments = (data: CommentsData, reviewId: ReviewId): CommentsData =>
  setReviewComments(data, reviewId, []);

// ===================== Selectors =====================

const EMPTY_LIST: ReadonlyArray<Comment> = [];

export const selectComments = (data: CommentsData, reviewId: ReviewId): ReadonlyArray<Comment> =>
  data.byReview[reviewId] ?? EMPTY_LIST;

export const countLiveComments = (comments: ReadonlyArray<Comment>): number =>
  comments.filter((comment) => !comment.deleted).length;

export type CommentNode = {
  readonly comment: Comment;
  readonly depth: number;
  readonly replies: ReadonlyArray<CommentNode>;
};

/**
 * Flat list → reply tree (oldest first at every level). Orphans (parent missing from data)
 * are shown at the top level rather than lost.
 */
export const buildThread = (comments: ReadonlyArray<Comment>): ReadonlyArray<CommentNode> => {
  const ids = new Set(comments.map((comment) => comment.id));
  const byParent = Map.groupBy(
    comments.toSorted((a, b) => a.createdAt - b.createdAt),
    (comment) => (comment.parentId !== null && ids.has(comment.parentId) ? comment.parentId : null),
  );
  const toNodes = (parentId: CommentId | null, depth: number): ReadonlyArray<CommentNode> =>
    (byParent.get(parentId) ?? []).map((comment) => ({
      comment,
      depth,
      replies: toNodes(comment.id, depth + 1),
    }));
  return toNodes(null, 0);
};
