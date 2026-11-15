import "server-only";
import { type Metadata } from "next";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { type MediaType } from "@/shared/lib/tmdb/types";
import { parseMediaId } from "../model/details";
import { getMediaDetails } from "./server";

const DESCRIPTION_LIMIT = 160;

const truncate = (text: string, limit: number): string =>
  text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;

/** Shared `generateMetadata` body for the movie and series detail routes. */
export async function buildMediaMetadata(mediaType: MediaType, rawId: string): Promise<Metadata> {
  const id = parseMediaId(rawId);
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
      type: mediaType === "movie" ? "video.movie" : "video.tv_show",
      images: poster ? [{ url: poster, width: 500, height: 750, alt: media.title }] : undefined,
    },
  };
}
