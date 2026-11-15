import "server-only";
import { type Metadata } from "next";
import { OG_POSTER_SIZE } from "@/shared/lib/tmdb/constants";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { MediaType } from "@/shared/lib/tmdb/types";
import { truncate } from "@/shared/utils/text";
import { parseTmdbId } from "@/shared/lib/tmdb/ids";
import { getMediaDetails } from "./server";

/** Search engines show ~155–160 characters of a description. */
const DESCRIPTION_LIMIT = 160;

const OG_TYPE: Readonly<Record<MediaType, "video.movie" | "video.tv_show">> = {
  [MediaType.Movie]: "video.movie",
  [MediaType.Tv]: "video.tv_show",
};

/** Shared `generateMetadata` body for the movie and series detail routes. */
export async function buildMediaMetadata(mediaType: MediaType, rawId: string): Promise<Metadata> {
  const id = parseTmdbId(rawId);
  const media = id === null ? null : await getMediaDetails(mediaType, id);
  if (!media) return { title: "Not found" };

  const poster = tmdbImageUrl(media.posterPath, "w500");
  const description = truncate(media.overview, DESCRIPTION_LIMIT) || undefined;

  return {
    title: media.title,
    description,
    openGraph: {
      title: media.title,
      description,
      type: OG_TYPE[mediaType],
      images: poster ? [{ url: poster, ...OG_POSTER_SIZE, alt: media.title }] : undefined,
    },
  };
}
