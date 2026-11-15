"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type BackupSource } from "@/shared/lib/backup";
import { persistedStoreOptions } from "@/shared/lib/storage";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import { createId } from "@/shared/utils/id";
import {
  addComment,
  type CommentId,
  type CommentInput,
  COMMENTS_STORAGE_KEY,
  COMMENTS_VERSION,
  type CommentsData,
  commentsDataSchema,
  deleteComment,
  editComment,
  EMPTY_COMMENTS,
  removeReviewComments,
} from "../model/comments";
import {
  addReview,
  deleteReview,
  EMPTY_REVIEWS,
  REVIEWS_STORAGE_KEY,
  REVIEWS_VERSION,
  type ReviewId,
  type ReviewInput,
  type ReviewsData,
  reviewsDataSchema,
  updateReview,
} from "../model/reviews";

type ReviewsStore = ReviewsData & {
  readonly add: (mediaKey: MediaKey, input: ReviewInput) => ReviewId;
  readonly update: (mediaKey: MediaKey, id: ReviewId, input: ReviewInput) => void;
  readonly remove: (mediaKey: MediaKey, id: ReviewId) => void;
};

export const useReviewsStore = create<ReviewsStore>()(
  persist(
    (set) => ({
      ...EMPTY_REVIEWS,
      add: (mediaKey, input) => {
        const id = createId();
        set((state) => addReview(state, mediaKey, input, id, Date.now()));
        return id;
      },
      update: (mediaKey, id, input) =>
        set((state) => updateReview(state, mediaKey, id, input, Date.now())),
      remove: (mediaKey, id) => set((state) => deleteReview(state, mediaKey, id)),
    }),
    persistedStoreOptions<ReviewsStore, ReviewsData>({
      name: REVIEWS_STORAGE_KEY,
      version: REVIEWS_VERSION,
      schema: reviewsDataSchema,
      pick: (state) => ({ byMedia: state.byMedia }),
    }),
  ),
);

type CommentsStore = CommentsData & {
  readonly add: (reviewId: ReviewId, parentId: CommentId | null, input: CommentInput) => void;
  readonly edit: (reviewId: ReviewId, id: CommentId, body: string) => void;
  readonly remove: (reviewId: ReviewId, id: CommentId) => void;
  readonly removeForReview: (reviewId: ReviewId) => void;
};

export const useCommentsStore = create<CommentsStore>()(
  persist(
    (set) => ({
      ...EMPTY_COMMENTS,
      add: (reviewId, parentId, input) =>
        set((state) => addComment(state, reviewId, parentId, input, createId(), Date.now())),
      edit: (reviewId, id, body) =>
        set((state) => editComment(state, reviewId, id, body, Date.now())),
      remove: (reviewId, id) => set((state) => deleteComment(state, reviewId, id, Date.now())),
      removeForReview: (reviewId) => set((state) => removeReviewComments(state, reviewId)),
    }),
    persistedStoreOptions<CommentsStore, CommentsData>({
      name: COMMENTS_STORAGE_KEY,
      version: COMMENTS_VERSION,
      schema: commentsDataSchema,
      pick: (state) => ({ byReview: state.byReview }),
    }),
  ),
);

/** Backup/restore hook-ups for the Preferences page. */
export const reviewsBackup: BackupSource<ReviewsData> = {
  key: REVIEWS_STORAGE_KEY,
  label: "Reviews",
  schema: reviewsDataSchema,
  read: () => ({ byMedia: useReviewsStore.getState().byMedia }),
  write: (data) => useReviewsStore.setState(data),
  clear: () => useReviewsStore.setState(EMPTY_REVIEWS),
};

export const commentsBackup: BackupSource<CommentsData> = {
  key: COMMENTS_STORAGE_KEY,
  label: "Comments",
  schema: commentsDataSchema,
  read: () => ({ byReview: useCommentsStore.getState().byReview }),
  write: (data) => useCommentsStore.setState(data),
  clear: () => useCommentsStore.setState(EMPTY_COMMENTS),
};
