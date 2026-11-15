"use client";

import { ChevronDown, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";
import { pluralize } from "@/shared/utils/text";
import { useCommentCount } from "../hooks/useReviews";
import { type Review, type ReviewInput, toFormValues } from "../model/reviews";
import { CommentThread } from "./CommentThread";
import { ConfirmDelete } from "./ConfirmDelete";
import { RatingStars } from "./RatingStars";
import { ReviewForm } from "./ReviewForm";

type Props = {
  readonly review: Review;
  readonly onUpdate: (input: ReviewInput) => void;
  readonly onDelete: () => void;
};

export function ReviewCard({ review, onUpdate, onDelete }: Props) {
  const format = useFormatters();
  const threadId = useId();
  const commentCount = useCommentCount(review.id);
  const [editing, setEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const edited = review.updatedAt > review.createdAt;

  if (editing) {
    return (
      <ReviewForm
        defaultValues={toFormValues(review)}
        submitLabel="Save changes"
        onCancel={() => setEditing(false)}
        onSubmit={(input) => {
          onUpdate(input);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <article className="space-y-3 rounded-lg border p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {review.title && <h3 className="font-semibold break-words">{review.title}</h3>}
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{review.author}</span>
            {" · "}
            <time dateTime={new Date(review.createdAt).toISOString()}>
              {format.date(review.createdAt)}
            </time>
            {edited && " · edited"}
          </p>
        </div>
        <RatingStars rating={review.rating} />
      </header>

      {/* Plain text rendering: user content is never interpreted as HTML. */}
      <p className="text-sm leading-relaxed break-words whitespace-pre-line">{review.body}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => setShowComments((open) => !open)}
          aria-expanded={showComments}
          aria-controls={threadId}
        >
          <MessageSquare className="size-4" aria-hidden />
          {commentCount > 0 ? pluralize(commentCount, "comment") : "Comment"}
          <ChevronDown
            className={cn("size-4 transition-transform", showComments && "rotate-180")}
            aria-hidden
          />
        </Button>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setEditing(true)}>
            <Pencil className="size-4" aria-hidden /> Edit
          </Button>
          <ConfirmDelete
            title="Delete this review?"
            description="The review and all of its comments will be removed. This can't be undone."
            onConfirm={onDelete}
            trigger={
              <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive">
                <Trash2 className="size-4" aria-hidden /> Delete
              </Button>
            }
          />
        </div>
      </div>

      {showComments && (
        <div id={threadId}>
          <CommentThread reviewId={review.id} />
        </div>
      )}
    </article>
  );
}
