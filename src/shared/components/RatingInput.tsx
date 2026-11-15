"use client";

import { Star } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/shared/utils/cn";
import { RATING_SCALE } from "@/shared/config/rating";

type Props = {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly onBlur?: () => void;
  readonly invalid?: boolean;
  readonly describedBy?: string;
  readonly legend?: string;
  /** Visually hide the legend (it is still announced). */
  readonly hideLegend?: boolean;
};

const RATINGS: ReadonlyArray<number> = Array.from(
  { length: RATING_SCALE.max - RATING_SCALE.min + 1 },
  (_, index) => RATING_SCALE.min + index,
);

/**
 * 1–10 star rating built on native radio inputs: arrow keys, focus and screen readers
 * work out of the box; the stars are only the visual layer.
 */
export function RatingInput({
  value,
  onChange,
  onBlur,
  invalid = false,
  describedBy,
  legend = "Your rating",
  hideLegend = false,
}: Props) {
  const name = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value;

  return (
    <fieldset aria-invalid={invalid} aria-describedby={describedBy} className="space-y-1.5">
      <legend className={cn("text-sm font-medium", hideLegend && "sr-only")}>{legend}</legend>
      <div className="flex flex-wrap items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
        {RATINGS.map((rating) => (
          <label
            key={rating}
            className="cursor-pointer rounded-sm p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            onMouseEnter={() => setHovered(rating)}
          >
            <input
              type="radio"
              name={name}
              value={rating}
              checked={value === rating}
              onChange={() => onChange(rating)}
              onBlur={onBlur}
              className="sr-only"
            />
            <Star
              aria-hidden
              className={cn(
                "size-6 transition-colors sm:size-5",
                rating <= shown ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50",
              )}
            />
            <span className="sr-only">
              {rating} out of {RATING_SCALE.max}
            </span>
          </label>
        ))}
        <span className="ml-2 text-sm text-muted-foreground tabular-nums" aria-hidden>
          {value > 0 ? `${value}/${RATING_SCALE.max}` : "–"}
        </span>
      </div>
    </fieldset>
  );
}
