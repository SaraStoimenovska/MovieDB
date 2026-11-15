import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { MediaCard } from "./MediaCard";

const GRID =
  "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

type Props = { readonly items: ReadonlyArray<MediaSummary>; readonly showType?: boolean };

export function MediaGrid({ items, showType = false }: Props) {
  return (
    <ul className={GRID}>
      {items.map((media, index) => (
        <li key={media.key}>
          <MediaCard media={media} showType={showType} priority={index < 6} />
        </li>
      ))}
    </ul>
  );
}
