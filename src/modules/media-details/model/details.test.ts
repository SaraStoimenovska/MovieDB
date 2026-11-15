import { describe, expect, it } from "vitest";
import { MediaType } from "@/shared/lib/tmdb/types";
import { deepFreeze, rawMovie, rawPage, rawTv } from "@/test/fixtures";
import {
  detailsRequestParams,
  type MediaDetails,
  mapCast,
  mapImages,
  mapKeyCrew,
  mapVideos,
  mapWatchProviders,
  needsArtworkFallback,
  parseMovieDetails,
  parseTvDetails,
  pickCertification,
  pickTrailer,
  pickTranslation,
  type Translation,
  withArtworkFallback,
} from "./details";
import { DETAILS_COPY, externalLinks, heroMetaItems, tmdbPageUrl, toFacts } from "./presentation";

const video = (patch: Record<string, unknown>) => ({
  key: "k",
  name: "Video",
  site: "YouTube",
  type: "Clip",
  official: false,
  ...patch,
});

const rawMovieDetails = deepFreeze({
  ...rawMovie(),
  genres: [{ id: 18, name: "Drama" }],
  tagline: "Mischief. Mayhem. Soap.",
  status: "Released",
  homepage: "",
  original_title: "Fight Club",
  original_language: "en",
  runtime: 139,
  budget: 63000000,
  revenue: 0,
  belongs_to_collection: null,
  production_companies: [{ name: "Fox 2000" }],
  production_countries: [{ name: "United States of America" }],
  spoken_languages: [{ english_name: "English" }],
  credits: {
    cast: [
      { id: 2, name: "Edward Norton", character: "Narrator", profile_path: null, order: 1 },
      { id: 1, name: "Brad Pitt", character: "Tyler Durden", profile_path: "/b.jpg", order: 0 },
      { id: "bad" },
    ],
    crew: [
      { name: "David Fincher", job: "Director" },
      { name: "Jim Uhls", job: "Screenplay" },
      { name: "Someone", job: "Catering" },
    ],
  },
  videos: {
    results: [
      video({ key: "teaser", type: "Teaser" }),
      video({ key: "trailer", type: "Trailer", official: true }),
    ],
  },
  images: {
    backdrops: [
      { file_path: "/a.jpg", width: 1, height: 1, vote_average: 1 },
      { file_path: "/b.jpg", width: 1, height: 1, vote_average: 9 },
    ],
    posters: [],
  },
  keywords: { keywords: [{ id: 825, name: "support group" }] },
  external_ids: { imdb_id: "tt0137523" },
  "watch/providers": {
    results: {
      US: {
        link: "https://tmdb/watch",
        flatrate: [
          { provider_id: 8, provider_name: "Netflix", logo_path: "/n.jpg", display_priority: 2 },
        ],
        rent: [
          { provider_id: 3, provider_name: "Google", logo_path: null, display_priority: 5 },
          { provider_id: 2, provider_name: "Apple", logo_path: null, display_priority: 1 },
        ],
        ads: [{ provider_id: 9, provider_name: "Tubi", logo_path: null }],
      },
    },
  },
  reviews: {
    results: [
      {
        id: "r1",
        author: "A",
        author_details: { rating: 8 },
        content: "Good",
        created_at: "2020-01-01",
        url: "u",
      },
    ],
    total_results: 13,
  },
  release_dates: {
    results: [{ iso_3166_1: "US", release_dates: [{ certification: "" }, { certification: "R" }] }],
  },
  recommendations: rawPage([rawMovie({ id: 680, title: "Pulp Fiction" })]),
});

describe("parseMovieDetails", () => {
  const media = parseMovieDetails(rawMovieDetails, "US");

  it("maps the summary and the extras", () => {
    expect(media).toMatchObject({
      key: "movie:550",
      title: "Fight Club",
      tagline: "Mischief. Mayhem. Soap.",
      originalTitle: null,
      certification: "R",
      runtimeMinutes: 139,
      budget: 63000000,
      revenue: null,
      homepage: null,
      imdbId: "tt0137523",
      creators: ["David Fincher"],
      genreIds: [18],
      keywords: [{ id: 825, name: "support group" }],
      tmdbReviewCount: 13,
    });
  });

  it("orders cast by billing and drops invalid members", () => {
    expect(media.cast.map((member) => member.name)).toEqual(["Brad Pitt", "Edward Norton"]);
  });

  it("keeps only key crew jobs", () => {
    expect(media.crew).toEqual([
      { job: "Director", names: ["David Fincher"] },
      { job: "Screenplay", names: ["Jim Uhls"] },
    ]);
  });

  it("puts the official trailer first", () => {
    expect(media.trailer?.key).toBe("trailer");
    expect(media.videos.map((v) => v.key)).toEqual(["trailer", "teaser"]);
  });

  it("sorts images by votes and maps recommendations", () => {
    expect(media.backdrops.map((image) => image.path)).toEqual(["/b.jpg", "/a.jpg"]);
    expect(media.recommendations.map((r) => r.title)).toEqual(["Pulp Fiction"]);
  });

  it("survives broken nested sections", () => {
    const broken = {
      ...rawMovie(),
      credits: "nope",
      videos: null,
      images: 42,
      recommendations: { bad: true },
    };
    const result = parseMovieDetails(broken, "US");
    expect([result.cast, result.videos, result.backdrops, result.recommendations]).toEqual([
      [],
      [],
      [],
      [],
    ]);
    expect(result.watchProviders).toBeNull();
  });

  it("throws when the core movie is invalid", () => {
    expect(() => parseMovieDetails({ id: "x" }, "US")).toThrow();
  });
});

describe("parseTvDetails", () => {
  const raw = {
    ...rawTv(),
    original_name: "GoT",
    episode_run_time: [],
    number_of_seasons: 8,
    number_of_episodes: 73,
    created_by: [{ name: "David Benioff" }, { name: "David Benioff" }],
    networks: [{ name: "HBO" }],
    last_air_date: "2019-05-19",
    next_episode_to_air: null,
    seasons: [
      {
        id: 2,
        season_number: 1,
        name: "Season 1",
        episode_count: 10,
        air_date: "2011-04-17",
        poster_path: null,
        overview: "",
      },
      {
        id: 1,
        season_number: 0,
        name: "Specials",
        episode_count: 3,
        air_date: "",
        poster_path: null,
        overview: "",
      },
    ],
    keywords: { results: [{ id: 1, name: "dragon" }] },
    content_ratings: { results: [{ iso_3166_1: "US", rating: "TV-MA" }] },
  };
  const media = parseTvDetails(raw, "US");

  it("maps series facts", () => {
    expect(media).toMatchObject({
      mediaType: MediaType.Tv,
      originalTitle: "GoT",
      runtimeMinutes: null,
      seasonCount: 8,
      episodeCount: 73,
      creators: ["David Benioff"],
      networks: ["HBO"],
      certification: "TV-MA",
      lastAirDate: "2019-05-19",
      nextEpisode: null,
    });
  });

  it("puts specials after regular seasons", () => {
    expect(media.seasons.map((season) => season.number)).toEqual([1, 0]);
    expect(media.seasons[1]?.airDate).toBeNull();
  });
});

describe("helpers", () => {
  it("mapVideos keeps YouTube only, best first", () => {
    const videos = mapVideos([
      video({ key: "v", site: "Vimeo", type: "Trailer" }),
      video({ key: "c" }),
      video({ key: "t", type: "Trailer" }),
    ]);
    expect(videos.map((v) => v.key)).toEqual(["t", "c"]);
    expect(pickTrailer(videos)?.key).toBe("t");
    expect(pickTrailer(mapVideos([video({})]))).toBeNull();
  });

  it("mapCast limits the list", () => {
    const cast = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      name: `P${i}`,
      character: "",
      profile_path: null,
      order: i,
    }));
    expect(mapCast(cast)).toHaveLength(20);
  });

  it("mapKeyCrew de-duplicates names", () => {
    expect(
      mapKeyCrew([
        { name: "A", job: "Director" },
        { name: "A", job: "Director" },
      ]),
    ).toEqual([{ job: "Director", names: ["A"] }]);
  });

  it("mapImages limits and sorts", () => {
    expect(mapImages([{ file_path: "/x", width: 1, height: 1, vote_average: null }], 0)).toEqual(
      [],
    );
  });

  it("mapWatchProviders sorts by priority, merges free + ads, and handles missing regions", () => {
    const providers = mapWatchProviders(rawMovieDetails["watch/providers"].results, "US");
    expect(providers?.rent.map((p) => p.name)).toEqual(["Apple", "Google"]);
    expect(providers?.free.map((p) => p.name)).toEqual(["Tubi"]);
    expect(mapWatchProviders({}, "DE")).toBeNull();
    expect(mapWatchProviders({ DE: { link: null } }, "DE")).toBeNull();
  });

  it("pickCertification takes the first non-empty value for the region", () => {
    const entries = [
      { region: "DE", values: ["16"] },
      { region: "US", values: ["", " ", "PG-13"] },
    ];
    expect(pickCertification(entries, "US")).toBe("PG-13");
    expect(pickCertification(entries, "FR")).toBeNull();
  });

  it("requests one combined payload with the right age-rating resource", () => {
    expect(detailsRequestParams(MediaType.Movie).append_to_response).toContain("release_dates");
    expect(detailsRequestParams(MediaType.Tv).append_to_response).toContain("content_ratings");
  });
});

describe("presentation", () => {
  const movie: MediaDetails = parseMovieDetails(rawMovieDetails, "US");

  it("builds the hero meta line", () => {
    expect(heroMetaItems(movie, "en-US")).toEqual(["Movie", "1999", "2h 19m"]);
  });

  it("lists only facts with values", () => {
    const labels = toFacts(movie, "en-US").map((fact) => fact.label);
    expect(labels).toContain(DETAILS_COPY[MediaType.Movie].releaseLabel);
    expect(labels).toContain("Budget");
    expect(labels).not.toContain("Revenue");
    expect(labels).not.toContain("Networks");
  });

  it("builds external links", () => {
    expect(externalLinks(movie).map((link) => link.label)).toEqual(["IMDb", "TMDB"]);
    expect(tmdbPageUrl(movie)).toBe("https://www.themoviedb.org/movie/550");
  });
});

describe("language fallback (no English overview / poster on TMDB)", () => {
  const t = (language: string, overview: string): Translation => ({
    language,
    overview,
    tagline: null,
  });

  // Shape of TMDB movie 1826223: original language es, only an es-MX translation has text.
  const untranslated = deepFreeze({
    ...rawMovieDetails,
    overview: "",
    tagline: "",
    poster_path: null,
    original_language: "es",
    translations: {
      translations: [
        { iso_639_1: "en", iso_3166_1: "US", data: { overview: "", tagline: "" } },
        { iso_639_1: "es", iso_3166_1: "MX", data: { overview: "El épico final", tagline: "" } },
      ],
    },
  });

  it("fills the overview from the best translation and marks its language", () => {
    const media = parseMovieDetails(untranslated, "US");
    expect(media.overview).toBe("El épico final");
    expect(media.overviewLanguage).toBe("es-MX");
    expect(media.fallbackLanguage).toBe("es-MX");
    expect(needsArtworkFallback(media)).toBe(true);
  });

  it("keeps the UI-language overview when there is one", () => {
    const media = parseMovieDetails(rawMovieDetails, "US");
    expect(media.overview).toBe(rawMovieDetails.overview);
    expect(media.overviewLanguage).toBeNull();
    expect(media.fallbackLanguage).toBeNull();
    expect(needsArtworkFallback(media)).toBe(false);
  });

  it("prefers English from another region, then the original language", () => {
    const list = [t("fr-FR", "fr"), t("es-ES", "es"), t("en-GB", "en")];
    expect(pickTranslation(list, "en-US", "es")?.language).toBe("en-GB");
    expect(pickTranslation(list.slice(0, 2), "en-US", "es")?.language).toBe("es-ES");
    expect(pickTranslation(list.slice(0, 1), "en-US", "es")?.language).toBe("fr-FR");
  });

  it("prefers a translation that actually has text, and skips the UI language itself", () => {
    expect(pickTranslation([t("en-GB", ""), t("de-DE", "de")], "en-US", null)?.language).toBe(
      "de-DE",
    );
    expect(pickTranslation([t("en-US", "en")], "en-US", null)).toBeNull();
    expect(pickTranslation([], "en-US", "es")).toBeNull();
  });

  it("fills only the missing artwork from the other-language response", () => {
    const media = parseMovieDetails(untranslated, "US");
    const filled = withArtworkFallback(media, { poster_path: "/es.jpg", backdrop_path: "/x.jpg" });
    expect(filled.posterPath).toBe("/es.jpg");
    expect(filled.backdropPath).toBe(media.backdropPath ?? "/x.jpg");
    expect(withArtworkFallback(media, "garbage")).toBe(media);
  });
});
