"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { Button } from "@/shared/ui/button";
import { truncate } from "@/shared/utils/text";
import { type TmdbReview } from "../model/details";
import { SECTION_IDS } from "../model/presentation";

const PREVIEW_CHARS = 420;

type Props = {
  readonly reviews: ReadonlyArray<TmdbReview>;
  readonly total: number;
  readonly tmdbUrl: string;
};

/** Reviews written on TMDB (read-only). The app's own reviews are a separate, local feature. */
export function TmdbReviews({ reviews, total, tmdbUrl }: Props) {
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby={SECTION_IDS.tmdbReviews} className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={SECTION_IDS.tmdbReviews} className="text-xl font-semibold tracking-tight">
          Reviews from TMDB{" "}
          <span className="text-base font-normal text-muted-foreground">({total})</span>
        </h2>
        {total > reviews.length && (
          <a
            href={`${tmdbUrl}/reviews`}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-4"
          >
            Read all on TMDB
          </a>
        )}
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewCard({ review }: { readonly review: TmdbReview }) {
  const [expanded, setExpanded] = useState(false);
  const format = useFormatters();
  const long = review.content.length > PREVIEW_CHARS;
  const text = expanded ? review.content : truncate(review.content, PREVIEW_CHARS);

  return (
    <article className="h-full space-y-3 rounded-lg border p-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium">{review.author}</p>
          <p className="text-xs text-muted-foreground">{format.date(review.createdAt)}</p>
        </div>
        {review.rating !== null && (
          <span className="inline-flex items-center gap-1 text-sm font-medium">
            <Star className="size-3.5 fill-yellow-400 text-yellow-400" aria-hidden />
            {format.rating(review.rating)}
            <span className="sr-only"> out of 10</span>
          </span>
        )}
      </header>
      {/* Rendered as plain text (never as HTML): user content from a third party. */}
      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{text}</p>
      {long && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
        </Button>
      )}
    </article>
  );
}
