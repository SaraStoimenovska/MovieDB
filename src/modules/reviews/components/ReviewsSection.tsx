"use client";

import { MessageSquareText, PenLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDisplayName } from "@/modules/preferences";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { pluralize } from "@/shared/utils/text";
import { useMediaReviews, useReviewActions } from "../hooks/useReviews";
import { emptyFormValues, REVIEW_LIMITS, type ReviewInput } from "../model/reviews";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";

type Props = { readonly mediaKey: MediaKey; readonly title: string };

const REVIEWS_HEADING_ID = "reviews-heading";

/** Local reviews of a title (written in this browser), with ratings and comment threads. */
export function ReviewsSection({ mediaKey, title }: Props) {
  const { reviews, average, ready } = useMediaReviews(mediaKey);
  const { add, update, remove } = useReviewActions();
  const { displayName, setDisplayName } = useDisplayName();
  const format = useFormatters();
  const [writing, setWriting] = useState(false);

  const create = (input: ReviewInput) => {
    add(mediaKey, input);
    setDisplayName(input.author);
    setWriting(false);
    toast("Review posted", { description: title });
  };

  return (
    <section aria-labelledby={REVIEWS_HEADING_ID} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={REVIEWS_HEADING_ID} className="text-xl font-semibold tracking-tight">
            Reviews
          </h2>
          {average !== null && (
            <p className="text-sm text-muted-foreground">
              Average {format.rating(average)}/{REVIEW_LIMITS.ratingMax} from{" "}
              {pluralize(reviews.length, "review")}
            </p>
          )}
        </div>
        {ready && !writing && (
          <Button onClick={() => setWriting(true)}>
            <PenLine className="size-4" aria-hidden />
            Write a review
          </Button>
        )}
      </div>

      {!ready ? (
        <div className="flex h-24 items-center justify-center">
          <Spinner label="Loading reviews" />
        </div>
      ) : (
        <>
          {writing && (
            <ReviewForm
              defaultValues={emptyFormValues(displayName)}
              submitLabel="Post review"
              onSubmit={create}
              onCancel={() => setWriting(false)}
            />
          )}

          {reviews.length === 0 && !writing ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
              <MessageSquareText className="size-6 text-muted-foreground" aria-hidden />
              <p className="font-medium">No reviews yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Share what you thought of {title}. Reviews are saved in this browser.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review.id}>
                  <ReviewCard
                    review={review}
                    onUpdate={(input) => update(mediaKey, review.id, input)}
                    onDelete={() => {
                      remove(mediaKey, review.id);
                      toast("Review deleted");
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
