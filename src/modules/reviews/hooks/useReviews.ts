"use client";

import { useCallback, useMemo } from "react";
import { useHydrated } from "@/shared/hooks/useHydrated";
import { useRehydrateOnStorage } from "@/shared/hooks/useRehydrateOnStorage";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import {
  buildThread,
  COMMENTS_STORAGE_KEY,
  countLiveComments,
  selectComments,
} from "../model/comments";
import {
  averageRating,
  REVIEWS_STORAGE_KEY,
  type ReviewId,
  selectReviews,
  sortNewestFirst,
} from "../model/reviews";
import { useCommentsStore, useReviewsStore } from "../store/reviews-store";

/** Reviews of one title, newest first; empty until hydrated (matches the server HTML). */
export const useMediaReviews = (mediaKey: MediaKey) => {
  const ready = useHydrated();
  const raw = useReviewsStore((state) => selectReviews(state, mediaKey));
  return useMemo(() => {
    const reviews = ready ? sortNewestFirst(raw) : [];
    return { reviews, average: averageRating(reviews), ready } as const;
  }, [raw, ready]);
};

export const useReviewActions = () => {
  const add = useReviewsStore((state) => state.add);
  const update = useReviewsStore((state) => state.update);
  const removeReview = useReviewsStore((state) => state.remove);
  const removeComments = useCommentsStore((state) => state.removeForReview);

  /** Deleting a review also deletes its comment thread. */
  const remove = useCallback(
    (mediaKey: MediaKey, id: ReviewId) => {
      removeReview(mediaKey, id);
      removeComments(id);
    },
    [removeReview, removeComments],
  );

  return { add, update, remove } as const;
};

export const useCommentThread = (reviewId: ReviewId) => {
  const ready = useHydrated();
  const comments = useCommentsStore((state) => selectComments(state, reviewId));
  return useMemo(() => (ready ? buildThread(comments) : []), [comments, ready]);
};

export const useCommentCount = (reviewId: ReviewId): number => {
  const ready = useHydrated();
  const count = useCommentsStore((state) => countLiveComments(selectComments(state, reviewId)));
  return ready ? count : 0;
};

export const useCommentActions = () => ({
  add: useCommentsStore((state) => state.add),
  edit: useCommentsStore((state) => state.edit),
  remove: useCommentsStore((state) => state.remove),
});

export const useReviewsCrossTabSync = () => {
  useRehydrateOnStorage(REVIEWS_STORAGE_KEY, useReviewsStore.persist.rehydrate);
  useRehydrateOnStorage(COMMENTS_STORAGE_KEY, useCommentsStore.persist.rehydrate);
};

/** Total reviews written in this browser (0 until hydrated). */
export const useReviewsCount = (): number => {
  const ready = useHydrated();
  const count = useReviewsStore((state) =>
    Object.values(state.byMedia).reduce((sum, reviews) => sum + reviews.length, 0),
  );
  return ready ? count : 0;
};
