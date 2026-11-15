import { formatYear } from "@/shared/utils/format";
import { MEDIA_TYPE_LABELS, type MediaSummary } from "@/shared/lib/tmdb/types";

const META_SEPARATOR = " · ";

/** "Movie · 1999": short caption for lists and suggestions (missing parts are skipped). */
export const mediaMetaLine = (
  media: Pick<MediaSummary, "mediaType" | "releaseDate">,
  locale: string,
) =>
  [MEDIA_TYPE_LABELS[media.mediaType], formatYear(media.releaseDate, locale)]
    .filter(Boolean)
    .join(META_SEPARATOR);
