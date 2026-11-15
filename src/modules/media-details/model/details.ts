import { z } from "zod";
import { TMDB_LANGUAGE } from "@/shared/config/app";
import { type Genre } from "@/modules/catalog";
import {
  mapMovie,
  mapTv,
  normalizeDate,
  parseMoviePage,
  parseTvPage,
} from "@/shared/lib/tmdb/mappers";
import { tmdbMovieSchema, tmdbTvSchema } from "@/shared/lib/tmdb/schemas";
import { UNRANKED } from "@/shared/lib/tmdb/constants";
import { type MediaSummary, MediaType } from "@/shared/lib/tmdb/types";

// ===================== Domain =====================

export type CastMember = {
  readonly id: number;
  readonly name: string;
  readonly character: string;
  readonly profilePath: string | null;
};

/** TMDB keyword (links to browse filtered by it). */
type Keyword = { readonly id: number; readonly name: string };

export type CrewCredit = { readonly job: string; readonly names: ReadonlyArray<string> };

export type Video = {
  readonly key: string;
  readonly name: string;
  readonly type: string;
  readonly official: boolean;
};

export type ImageAsset = {
  readonly path: string;
  readonly width: number;
  readonly height: number;
};

export type WatchProvider = {
  readonly id: number;
  readonly name: string;
  readonly logoPath: string | null;
};

export type WatchProviders = {
  /** TMDB/JustWatch page listing all offers for the region. */
  readonly link: string | null;
  readonly stream: ReadonlyArray<WatchProvider>;
  readonly free: ReadonlyArray<WatchProvider>;
  readonly rent: ReadonlyArray<WatchProvider>;
  readonly buy: ReadonlyArray<WatchProvider>;
};

type Season = {
  readonly id: number;
  readonly number: number;
  readonly name: string;
  readonly episodeCount: number;
  readonly airDate: string | null;
  readonly posterPath: string | null;
  readonly overview: string;
};

type EpisodeInfo = {
  readonly name: string;
  readonly airDate: string | null;
  readonly season: number;
  readonly episode: number;
};

export type TmdbReview = {
  readonly id: string;
  readonly author: string;
  readonly rating: number | null;
  readonly content: string;
  readonly createdAt: string;
  readonly url: string;
};

export type MediaDetails = MediaSummary & {
  readonly tagline: string | null;
  readonly originalTitle: string | null;
  readonly originalLanguage: string | null;
  /**
   * BCP 47 tag (e.g. "es-MX") when the overview/tagline come from a translation because TMDB has
   * none in the UI language; `null` when they're in the UI language.
   */
  readonly overviewLanguage: string | null;
  /** Best other language to ask TMDB for missing artwork (e.g. no English poster). */
  readonly fallbackLanguage: string | null;
  readonly certification: string | null;
  readonly genres: ReadonlyArray<Genre>;
  readonly keywords: ReadonlyArray<Keyword>;
  readonly runtimeMinutes: number | null;
  readonly status: string | null;
  readonly homepage: string | null;
  readonly imdbId: string | null;
  readonly budget: number | null;
  readonly revenue: number | null;
  readonly collection: string | null;
  readonly companies: ReadonlyArray<string>;
  readonly countries: ReadonlyArray<string>;
  readonly spokenLanguages: ReadonlyArray<string>;
  // Series only (null / empty for movies)
  readonly networks: ReadonlyArray<string>;
  readonly seasonCount: number | null;
  readonly episodeCount: number | null;
  readonly seasons: ReadonlyArray<Season>;
  readonly lastAirDate: string | null;
  readonly nextEpisode: EpisodeInfo | null;
  // People
  /** Directors (movies) or creators (series). */
  readonly creators: ReadonlyArray<string>;
  readonly crew: ReadonlyArray<CrewCredit>;
  readonly cast: ReadonlyArray<CastMember>;
  // Media
  readonly trailer: Video | null;
  readonly videos: ReadonlyArray<Video>;
  readonly backdrops: ReadonlyArray<ImageAsset>;
  readonly posters: ReadonlyArray<ImageAsset>;
  // Elsewhere
  readonly watchProviders: WatchProviders | null;
  readonly tmdbReviews: ReadonlyArray<TmdbReview>;
  readonly tmdbReviewCount: number;
  readonly recommendations: ReadonlyArray<MediaSummary>;
};

// ===================== Request =====================

/** Sub-resources fetched together with the details (TMDB allows up to 20 appends). */
const COMMON_APPENDS = [
  "credits",
  "videos",
  "images",
  "keywords",
  "recommendations",
  "external_ids",
  "watch/providers",
  "reviews",
  // Fallback text when the UI language has no overview (see `pickTranslation`).
  "translations",
] as const;

/** Age ratings live in a differently named resource per media type. */
const AGE_RATING_APPEND: Readonly<Record<MediaType, string>> = {
  [MediaType.Movie]: "release_dates",
  [MediaType.Tv]: "content_ratings",
};

/** Images/videos are otherwise filtered to the UI language; "null" adds language-neutral ones. */
const ASSET_LANGUAGES = "en,null";

/** One request for everything on the details page. */
export const detailsRequestParams = (mediaType: MediaType) => ({
  append_to_response: [...COMMON_APPENDS, AGE_RATING_APPEND[mediaType]].join(","),
  include_image_language: ASSET_LANGUAGES,
  include_video_language: ASSET_LANGUAGES,
});

// ===================== Raw schemas (lenient) =====================

const emptyToNull = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null));

const positiveOrNull = z
  .number()
  .nullish()
  .transform((v) => (v && v > 0 ? v : null));

const textOrEmpty = z
  .string()
  .nullish()
  .transform((v) => v ?? "");

/** Array whose invalid items are dropped instead of failing the page. */
const lenientArray = <S extends z.ZodType>(schema: S) =>
  z
    .array(z.unknown())
    .nullish()
    .transform((items): ReadonlyArray<z.infer<S>> =>
      (items ?? []).flatMap((item) => {
        const parsed = schema.safeParse(item);
        return parsed.success ? [parsed.data as z.infer<S>] : [];
      }),
    );

/** Object that falls back to `fallback` when missing or malformed. */
const lenientObject = <S extends z.ZodType, F>(schema: S, fallback: F) =>
  // `.optional()` first: in Zod v4 a transformed `unknown` is still a *required* key, so a
  // response without e.g. `videos` would fail the whole page instead of using the fallback.
  z
    .unknown()
    .optional()
    .transform((value): z.infer<S> | F => {
      const parsed = schema.safeParse(value);
      return parsed.success ? (parsed.data as z.infer<S>) : fallback;
    });

const named = z.object({ name: z.string() });
const namedWithId = z.object({ id: z.number(), name: z.string() });

const castSchema = z.object({
  id: z.number(),
  name: z.string(),
  character: textOrEmpty,
  profile_path: emptyToNull,
  order: z.number().nullish(),
});

const crewSchema = z.object({ name: z.string(), job: textOrEmpty });

const videoSchema = z.object({
  key: z.string(),
  name: z.string(),
  site: z.string(),
  type: z.string(),
  official: z.boolean().nullish(),
});

const imageSchema = z.object({
  file_path: z.string(),
  width: z.number(),
  height: z.number(),
  vote_average: z.number().nullish(),
});

const providerSchema = z.object({
  provider_id: z.number(),
  provider_name: z.string(),
  logo_path: emptyToNull,
  display_priority: z.number().nullish(),
});

const regionProvidersSchema = z.object({
  link: emptyToNull,
  flatrate: lenientArray(providerSchema),
  free: lenientArray(providerSchema),
  ads: lenientArray(providerSchema),
  rent: lenientArray(providerSchema),
  buy: lenientArray(providerSchema),
});

const reviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  author_details: lenientObject(z.object({ rating: z.number().nullish() }), { rating: null }),
  content: z.string(),
  created_at: z.string(),
  url: z.string(),
});

const translationSchema = z.object({
  iso_639_1: z.string(),
  iso_3166_1: z.string(),
  data: z.object({ overview: textOrEmpty, tagline: emptyToNull }),
});

type RawTranslation = z.infer<typeof translationSchema>;

const commonExtras = {
  genres: lenientArray(z.object({ id: z.number(), name: z.string() })),
  tagline: emptyToNull,
  status: emptyToNull,
  homepage: emptyToNull,
  original_language: emptyToNull,
  production_companies: lenientArray(named),
  production_countries: lenientArray(named),
  spoken_languages: lenientArray(z.object({ english_name: z.string() })),
  credits: lenientObject(
    z.object({ cast: lenientArray(castSchema), crew: lenientArray(crewSchema) }),
    { cast: [], crew: [] },
  ),
  videos: lenientObject(z.object({ results: lenientArray(videoSchema) }), { results: [] }),
  images: lenientObject(
    z.object({ backdrops: lenientArray(imageSchema), posters: lenientArray(imageSchema) }),
    { backdrops: [], posters: [] },
  ),
  external_ids: lenientObject(z.object({ imdb_id: emptyToNull }), { imdb_id: null }),
  "watch/providers": lenientObject(z.object({ results: z.record(z.string(), z.unknown()) }), {
    results: {},
  }),
  reviews: lenientObject(
    z.object({ results: lenientArray(reviewSchema), total_results: z.number() }),
    { results: [], total_results: 0 },
  ),
  recommendations: z.unknown().optional(),
  translations: lenientObject(z.object({ translations: lenientArray(translationSchema) }), {
    translations: [],
  }),
};

const tmdbMovieDetailsSchema = tmdbMovieSchema.extend({
  ...commonExtras,
  original_title: emptyToNull,
  runtime: positiveOrNull,
  budget: positiveOrNull,
  revenue: positiveOrNull,
  belongs_to_collection: lenientObject(named, null),
  keywords: lenientObject(z.object({ keywords: lenientArray(namedWithId) }), { keywords: [] }),
  release_dates: lenientObject(
    z.object({
      results: lenientArray(
        z.object({
          iso_3166_1: z.string(),
          release_dates: lenientArray(z.object({ certification: textOrEmpty })),
        }),
      ),
    }),
    { results: [] },
  ),
});

const episodeSchema = z.object({
  name: textOrEmpty,
  air_date: emptyToNull,
  season_number: z.number(),
  episode_number: z.number(),
});

const tmdbTvDetailsSchema = tmdbTvSchema.extend({
  ...commonExtras,
  original_name: emptyToNull,
  episode_run_time: lenientArray(z.number()),
  number_of_seasons: positiveOrNull,
  number_of_episodes: positiveOrNull,
  created_by: lenientArray(named),
  networks: lenientArray(named),
  last_air_date: emptyToNull,
  next_episode_to_air: lenientObject(episodeSchema, null),
  seasons: lenientArray(
    z.object({
      id: z.number(),
      season_number: z.number(),
      name: z.string(),
      episode_count: z.number().nullish(),
      air_date: emptyToNull,
      poster_path: emptyToNull,
      overview: textOrEmpty,
    }),
  ),
  keywords: lenientObject(z.object({ results: lenientArray(namedWithId) }), { results: [] }),
  content_ratings: lenientObject(
    z.object({ results: lenientArray(z.object({ iso_3166_1: z.string(), rating: textOrEmpty })) }),
    { results: [] },
  ),
});

type RawVideo = z.infer<typeof videoSchema>;
type RawCast = z.infer<typeof castSchema>;
type RawCrew = z.infer<typeof crewSchema>;
type RawImage = z.infer<typeof imageSchema>;
type RawProvider = z.infer<typeof providerSchema>;
type RawReview = z.infer<typeof reviewSchema>;

// ===================== Pure helpers =====================

const LIMITS = {
  cast: 20,
  videos: 12,
  backdrops: 20,
  posters: 12,
  keywords: 20,
  reviews: 5,
  recommendations: 18,
} as const;

const unique = (values: ReadonlyArray<string>): ReadonlyArray<string> => [...new Set(values)];

const VIDEO_TYPE_RANK: Readonly<Record<string, number>> = {
  Trailer: 4,
  Teaser: 3,
  Clip: 2,
  Featurette: 1,
};

const videoRank = (video: RawVideo): number =>
  (VIDEO_TYPE_RANK[video.type] ?? 0) * 2 + (video.official ? 1 : 0);

/** YouTube only (we embed with youtube-nocookie), best first: official trailer > trailer > teaser… */
export const mapVideos = (videos: ReadonlyArray<RawVideo>): ReadonlyArray<Video> =>
  videos
    .filter((video) => video.site === "YouTube")
    .toSorted((a, b) => videoRank(b) - videoRank(a))
    .slice(0, LIMITS.videos)
    .map((video) => ({
      key: video.key,
      name: video.name,
      type: video.type,
      official: video.official ?? false,
    }));

export const pickTrailer = (videos: ReadonlyArray<Video>): Video | null =>
  videos.find((video) => video.type === "Trailer" || video.type === "Teaser") ?? null;

export const mapCast = (cast: ReadonlyArray<RawCast>): ReadonlyArray<CastMember> =>
  cast
    .toSorted((a, b) => (a.order ?? UNRANKED) - (b.order ?? UNRANKED))
    .slice(0, LIMITS.cast)
    .map((member) => ({
      id: member.id,
      name: member.name,
      character: member.character,
      profilePath: member.profile_path,
    }));

/** Jobs worth showing, in display order. Everyone else in the crew list is noise for viewers. */
const KEY_JOBS: ReadonlyArray<string> = [
  "Director",
  "Screenplay",
  "Writer",
  "Story",
  "Novel",
  "Producer",
  "Original Music Composer",
  "Director of Photography",
  "Editor",
];

export const mapKeyCrew = (crew: ReadonlyArray<RawCrew>): ReadonlyArray<CrewCredit> =>
  KEY_JOBS.map((job) => ({
    job,
    names: unique(crew.filter((member) => member.job === job).map((member) => member.name)).slice(
      0,
      4,
    ),
  })).filter((credit) => credit.names.length > 0);

/** Highest-voted first; TMDB sorts by language, not quality. */
export const mapImages = (
  images: ReadonlyArray<RawImage>,
  limit: number,
): ReadonlyArray<ImageAsset> =>
  images
    .toSorted((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    .slice(0, limit)
    .map((image) => ({ path: image.file_path, width: image.width, height: image.height }));

const mapProviders = (providers: ReadonlyArray<RawProvider>): ReadonlyArray<WatchProvider> =>
  providers
    .toSorted((a, b) => (a.display_priority ?? UNRANKED) - (b.display_priority ?? UNRANKED))
    .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path }));

const uniqueProviders = (providers: ReadonlyArray<WatchProvider>): ReadonlyArray<WatchProvider> =>
  providers.filter((provider, index) => providers.findIndex((p) => p.id === provider.id) === index);

export const mapWatchProviders = (
  byRegion: Readonly<Record<string, unknown>>,
  region: string,
): WatchProviders | null => {
  const parsed = regionProvidersSchema.safeParse(byRegion[region]);
  if (!parsed.success) return null;
  const { link, flatrate, free, ads, rent, buy } = parsed.data;
  const result: WatchProviders = {
    link,
    stream: mapProviders(flatrate),
    free: uniqueProviders(mapProviders([...free, ...ads])),
    rent: mapProviders(rent),
    buy: mapProviders(buy),
  };
  const empty = [result.stream, result.free, result.rent, result.buy].every(
    (list) => list.length === 0,
  );
  return empty ? null : result;
};

const mapReviews = (reviews: ReadonlyArray<RawReview>): ReadonlyArray<TmdbReview> =>
  reviews.slice(0, LIMITS.reviews).map((review) => ({
    id: review.id,
    author: review.author,
    rating: review.author_details.rating ?? null,
    content: review.content,
    createdAt: review.created_at,
    url: review.url,
  }));

/** First non-empty certification for the region (TMDB lists one per release type). */
export const pickCertification = (
  entries: ReadonlyArray<{ readonly region: string; readonly values: ReadonlyArray<string> }>,
  region: string,
): string | null =>
  entries
    .filter((entry) => entry.region === region)
    .flatMap((entry) => entry.values)
    .find((value) => value.trim() !== "") ?? null;

/** Only show the original title when it actually differs. */
export type Translation = {
  /** BCP 47 tag, e.g. "es-MX". */
  readonly language: string;
  readonly overview: string;
  readonly tagline: string | null;
};

export const toTranslations = (raw: ReadonlyArray<RawTranslation>): ReadonlyArray<Translation> =>
  raw.map((t) => ({
    language: `${t.iso_639_1}-${t.iso_3166_1}`,
    overview: t.data.overview,
    tagline: t.data.tagline,
  }));

const languageOf = (tag: string): string => tag.split("-")[0] ?? tag;

/**
 * Pure: the best translation to fall back to: one with an overview first, then the UI language
 * (another region of it), then the original language, then any other, keeping TMDB's order.
 * The exact UI language is skipped: it's what came back empty.
 */
export const pickTranslation = (
  translations: ReadonlyArray<Translation>,
  uiLanguage: string,
  originalLanguage: string | null,
): Translation | null => {
  const rank = (t: Translation): number =>
    (t.overview ? 0 : 3) +
    (languageOf(t.language) === languageOf(uiLanguage)
      ? 0
      : languageOf(t.language) === originalLanguage
        ? 1
        : 2);
  return (
    translations
      .filter((t) => t.language !== uiLanguage)
      .toSorted((a, b) => rank(a) - rank(b))[0] ?? null
  );
};

/** Fills an empty overview (and tagline) from the best translation. */
const withTextFallback = (
  raw: {
    readonly overview: string;
    readonly tagline: string | null;
    readonly original_language: string | null;
    readonly translations: { readonly translations: ReadonlyArray<RawTranslation> };
  },
  uiLanguage: string,
) => {
  const fallback = pickTranslation(
    toTranslations(raw.translations.translations),
    uiLanguage,
    raw.original_language,
  );
  const useFallback = !raw.overview && fallback !== null && fallback.overview !== "";
  return {
    overview: useFallback ? fallback.overview : raw.overview,
    tagline: useFallback ? (raw.tagline ?? fallback.tagline) : raw.tagline,
    overviewLanguage: useFallback ? fallback.language : null,
    fallbackLanguage: fallback?.language ?? null,
  };
};

const differentOrNull = (original: string | null, title: string): string | null =>
  original && original !== title ? original : null;

/** Typical episode length: TMDB often returns [] for modern series. */
const firstPositive = (values: ReadonlyArray<number>): number | null =>
  values.find((value) => value > 0) ?? null;

const safeRecommendations = (
  raw: unknown,
  parse: (raw: unknown) => { readonly results: ReadonlyArray<MediaSummary> },
): ReadonlyArray<MediaSummary> => {
  try {
    return parse(raw).results.slice(0, LIMITS.recommendations);
  } catch {
    return [];
  }
};

/** Season 0 ("Specials") goes last; regular seasons in order. */
const sortSeasons = (seasons: ReadonlyArray<Season>): ReadonlyArray<Season> =>
  seasons.toSorted((a, b) => (a.number === 0 ? 1 : b.number === 0 ? -1 : a.number - b.number));

// ===================== Mappers =====================

type CommonRaw = z.infer<typeof tmdbMovieDetailsSchema> | z.infer<typeof tmdbTvDetailsSchema>;

const mapCommon = (raw: CommonRaw, region: string) => {
  const videos = mapVideos(raw.videos.results);
  return {
    tagline: raw.tagline,
    originalLanguage: raw.original_language,
    genres: raw.genres,
    status: raw.status,
    homepage: raw.homepage,
    imdbId: raw.external_ids.imdb_id,
    companies: raw.production_companies.map((c) => c.name),
    countries: raw.production_countries.map((c) => c.name),
    spokenLanguages: unique(raw.spoken_languages.map((l) => l.english_name).filter(Boolean)),
    crew: mapKeyCrew(raw.credits.crew),
    cast: mapCast(raw.credits.cast),
    videos,
    trailer: pickTrailer(videos),
    backdrops: mapImages(raw.images.backdrops, LIMITS.backdrops),
    posters: mapImages(raw.images.posters, LIMITS.posters),
    watchProviders: mapWatchProviders(raw["watch/providers"].results, region),
    tmdbReviews: mapReviews(raw.reviews.results),
    tmdbReviewCount: raw.reviews.total_results,
  };
};

export const parseMovieDetails = (raw: unknown, region: string): MediaDetails => {
  const movie = tmdbMovieDetailsSchema.parse(raw);
  return {
    ...mapMovie({ ...movie, genre_ids: movie.genres.map((genre) => genre.id) }),
    ...mapCommon(movie, region),
    ...withTextFallback(movie, TMDB_LANGUAGE),
    originalTitle: differentOrNull(movie.original_title, movie.title),
    certification: pickCertification(
      movie.release_dates.results.map((r) => ({
        region: r.iso_3166_1,
        values: r.release_dates.map((d) => d.certification),
      })),
      region,
    ),
    keywords: movie.keywords.keywords.slice(0, LIMITS.keywords),
    runtimeMinutes: movie.runtime,
    budget: movie.budget,
    revenue: movie.revenue,
    collection: movie.belongs_to_collection?.name ?? null,
    networks: [],
    seasonCount: null,
    episodeCount: null,
    seasons: [],
    lastAirDate: null,
    nextEpisode: null,
    creators: unique(movie.credits.crew.filter((c) => c.job === "Director").map((c) => c.name)),
    recommendations: safeRecommendations(movie.recommendations, parseMoviePage),
  };
};

export const parseTvDetails = (raw: unknown, region: string): MediaDetails => {
  const tv = tmdbTvDetailsSchema.parse(raw);
  return {
    ...mapTv({ ...tv, genre_ids: tv.genres.map((genre) => genre.id) }),
    ...mapCommon(tv, region),
    ...withTextFallback(tv, TMDB_LANGUAGE),
    originalTitle: differentOrNull(tv.original_name, tv.name),
    certification: pickCertification(
      tv.content_ratings.results.map((r) => ({ region: r.iso_3166_1, values: [r.rating] })),
      region,
    ),
    keywords: tv.keywords.results.slice(0, LIMITS.keywords),
    runtimeMinutes: firstPositive(tv.episode_run_time),
    budget: null,
    revenue: null,
    collection: null,
    networks: tv.networks.map((n) => n.name),
    seasonCount: tv.number_of_seasons,
    episodeCount: tv.number_of_episodes,
    seasons: sortSeasons(
      tv.seasons.map((s) => ({
        id: s.id,
        number: s.season_number,
        name: s.name,
        episodeCount: s.episode_count ?? 0,
        airDate: normalizeDate(s.air_date),
        posterPath: s.poster_path,
        overview: s.overview,
      })),
    ),
    lastAirDate: normalizeDate(tv.last_air_date),
    nextEpisode: tv.next_episode_to_air
      ? {
          name: tv.next_episode_to_air.name,
          airDate: normalizeDate(tv.next_episode_to_air.air_date),
          season: tv.next_episode_to_air.season_number,
          episode: tv.next_episode_to_air.episode_number,
        }
      : null,
    creators: unique(tv.created_by.map((creator) => creator.name)),
    recommendations: safeRecommendations(tv.recommendations, parseTvPage),
  };
};

export const DETAILS_PARSERS: Readonly<
  Record<MediaType, (raw: unknown, region: string) => MediaDetails>
> = {
  [MediaType.Movie]: parseMovieDetails,
  [MediaType.Tv]: parseTvDetails,
};

// ===================== Artwork fallback =====================

/** Just the artwork of a details response in another language. */
const artworkSchema = z.object({ poster_path: emptyToNull, backdrop_path: emptyToNull });

/** Does the page still miss artwork that another language might have? */
export const needsArtworkFallback = (details: MediaDetails): boolean =>
  details.fallbackLanguage !== null && (!details.posterPath || !details.backdropPath);

/** Pure: fill missing poster/backdrop from a details response in `fallbackLanguage`. */
export const withArtworkFallback = (details: MediaDetails, raw: unknown): MediaDetails => {
  const artwork = artworkSchema.safeParse(raw);
  if (!artwork.success) return details;
  return {
    ...details,
    posterPath: details.posterPath ?? artwork.data.poster_path,
    backdropPath: details.backdropPath ?? artwork.data.backdrop_path,
  };
};
