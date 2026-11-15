import { Star } from "lucide-react";
import { APP_LOCALE } from "@/shared/config/app";
import { formatRating } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";

type Props = { readonly value: number; readonly voteCount: number; readonly className?: string };

/** TMDB average with a star; hidden when nobody has voted yet (TMDB reports 0). */
export function MediaRating({ value, voteCount, className }: Props) {
  if (voteCount === 0) return null;
  const rating = formatRating(value, APP_LOCALE);

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm tabular-nums", className)}>
      <Star className="size-3.5 fill-yellow-400 text-yellow-400" aria-hidden />
      <span>
        {rating}
        <span className="sr-only"> out of 10</span>
      </span>
    </span>
  );
}
