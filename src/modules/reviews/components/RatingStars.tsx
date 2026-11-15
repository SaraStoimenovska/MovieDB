import { Star } from "lucide-react";
import { REVIEW_LIMITS } from "../model/reviews";

/** Compact read-only rating: ★ 8/10. */
export function RatingStars({ rating }: { readonly rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums">
      <Star className="size-4 fill-yellow-400 text-yellow-400" aria-hidden />
      {rating}
      <span className="text-muted-foreground">/{REVIEW_LIMITS.ratingMax}</span>
      <span className="sr-only"> stars</span>
    </span>
  );
}
