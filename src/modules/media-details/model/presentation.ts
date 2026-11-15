import { MEDIA_TYPE_LABELS, MediaType } from "@/shared/lib/tmdb/types";
import {
  formatCurrency,
  formatDate,
  formatLanguage,
  formatRuntime,
  formatYear,
} from "@/shared/utils/format";
import { pluralize } from "@/shared/utils/text";
import { type MediaDetails } from "./details";

/** Wording that differs between movies and series. */
export const DETAILS_COPY: Readonly<
  Record<
    MediaType,
    {
      readonly releaseLabel: string;
      readonly creatorsLabel: string;
      readonly creatorsPrefix: string;
    }
  >
> = {
  [MediaType.Movie]: {
    releaseLabel: "Release date",
    creatorsLabel: "Director",
    creatorsPrefix: "Directed by",
  },
  [MediaType.Tv]: {
    releaseLabel: "First aired",
    creatorsLabel: "Created by",
    creatorsPrefix: "Created by",
  },
};

/** In-page anchors (e.g. the hero's "Watch trailer" jumps to the videos section). */
export const SECTION_IDS = {
  videos: "videos",
  cast: "cast-heading",
  facts: "facts-heading",
  seasons: "seasons-heading",
  images: "images-heading",
  providers: "providers-heading",
  tmdbReviews: "tmdb-reviews-heading",
  notes: "notes-heading",
  reviews: "reviews-heading",
} as const;

/** Max items shown for list-valued facts before cutting off. */
const FACT_LIST_LIMIT = { default: 4, companies: 3 } as const;

/** "Movie · 1999 · 2h 19m" / "Series · 2011 · 1h / episode · 8 seasons". */
export const heroMetaItems = (media: MediaDetails, locale: string): ReadonlyArray<string> => {
  const runtime = formatRuntime(media.runtimeMinutes, locale);
  return [
    MEDIA_TYPE_LABELS[media.mediaType],
    formatYear(media.releaseDate, locale),
    media.mediaType === MediaType.Tv && runtime ? `${runtime} / episode` : runtime,
    media.seasonCount ? pluralize(media.seasonCount, "season") : "",
  ].filter(Boolean);
};

export type Fact = { readonly label: string; readonly value: string };

const list = (values: ReadonlyArray<string>, max: number = FACT_LIST_LIMIT.default): string =>
  values.slice(0, max).join(", ");

/** Details → the facts worth showing, in display order (empty values dropped). */
export const toFacts = (media: MediaDetails, locale: string): ReadonlyArray<Fact> => {
  const date = (value: string | null) => formatDate(value, locale, { dateStyle: "long" });
  const next = media.nextEpisode;

  return [
    { label: DETAILS_COPY[media.mediaType].releaseLabel, value: date(media.releaseDate) },
    { label: "Last aired", value: date(media.lastAirDate) },
    {
      label: "Next episode",
      value: next
        ? `S${next.season} E${next.episode}${next.airDate ? ` · ${date(next.airDate)}` : ""}`
        : "",
    },
    { label: "Status", value: media.status ?? "" },
    { label: "Episodes", value: media.episodeCount ? String(media.episodeCount) : "" },
    { label: "Networks", value: list(media.networks) },
    { label: "Original language", value: formatLanguage(media.originalLanguage, locale) },
    { label: "Spoken languages", value: list(media.spokenLanguages) },
    { label: "Countries", value: list(media.countries) },
    { label: "Production", value: list(media.companies, FACT_LIST_LIMIT.companies) },
    { label: "Collection", value: media.collection ?? "" },
    { label: "Budget", value: formatCurrency(media.budget, locale) },
    { label: "Revenue", value: formatCurrency(media.revenue, locale) },
  ].filter((fact) => fact.value !== "");
};

/** Public pages for the title elsewhere on the web. */
export const externalLinks = (
  media: Pick<MediaDetails, "mediaType" | "id" | "homepage" | "imdbId">,
): ReadonlyArray<{ readonly label: string; readonly href: string }> =>
  [
    media.homepage ? { label: "Official website", href: media.homepage } : null,
    media.imdbId
      ? { label: "IMDb", href: `https://www.imdb.com/title/${encodeURIComponent(media.imdbId)}/` }
      : null,
    { label: "TMDB", href: tmdbPageUrl(media) },
  ].filter((link): link is { label: string; href: string } => link !== null);

export const tmdbPageUrl = (media: Pick<MediaDetails, "mediaType" | "id">): string =>
  `https://www.themoviedb.org/${media.mediaType}/${media.id}`;
