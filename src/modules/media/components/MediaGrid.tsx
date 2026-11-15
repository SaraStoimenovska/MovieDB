import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { MediaCard } from "./MediaCard";

/** 2 columns on phones up to 6 on wide screens; tighter gaps on small screens. */
const GRID =
  "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
const CARD_SIZES =
  "(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw";

/** Cards likely above the fold load eagerly (one full row on the widest layout). */
const EAGER_CARDS = 6;

type Props = { readonly items: ReadonlyArray<MediaSummary>; readonly showType?: boolean };

export function MediaGrid({ items, showType = false }: Props) {
  return (
    <ul className={GRID}>
      {items.map((media, index) => (
        <li key={media.key} className="min-w-0">
          <MediaCard
            media={media}
            showType={showType}
            priority={index < EAGER_CARDS}
            sizes={CARD_SIZES}
          />
        </li>
      ))}
    </ul>
  );
}
