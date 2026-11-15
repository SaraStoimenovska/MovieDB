import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { type ReactNode } from "react";
import { MediaPoster, MediaRating } from "@/modules/media";
import { APP_LOCALE } from "@/shared/config/app";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { formatCompactNumber, formatLanguage } from "@/shared/utils/format";
import { type MediaDetails } from "../model/details";
import { DETAILS_COPY, heroMetaItems, SECTION_IDS } from "../model/presentation";

type Props = { readonly media: MediaDetails; readonly actions?: ReactNode };

export function MediaHero({ media, actions }: Props) {
  const backdrop = tmdbImageUrl(media.backdropPath, "w1280");
  const meta = heroMetaItems(media, APP_LOCALE);

  return (
    <section className="relative -mx-4 -mt-8 overflow-hidden sm:mx-0 sm:rounded-xl">
      {backdrop && (
        <Image
          src={backdrop}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-top opacity-30"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />

      <div className="relative grid gap-6 px-4 py-8 sm:grid-cols-[200px_1fr] sm:px-8 md:grid-cols-[260px_1fr] md:py-12">
        <MediaPoster
          path={media.posterPath}
          title={media.title}
          size="w500"
          sizes="(min-width: 768px) 260px, (min-width: 640px) 200px, 60vw"
          priority
          className="mx-auto w-48 shadow-xl sm:w-full"
        />

        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl md:text-4xl">
              {media.title}
            </h1>
            {media.originalTitle && (
              <p className="text-sm text-muted-foreground">Original title: {media.originalTitle}</p>
            )}
            {media.tagline && (
              <p className="text-lg text-muted-foreground italic">{media.tagline}</p>
            )}
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {media.certification && (
                <Badge variant="outline" className="mr-1" title="Age rating">
                  {media.certification}
                </Badge>
              )}
              {meta.map((item, index) => (
                <span key={item} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden>·</span>}
                  {item}
                </span>
              ))}
            </p>
          </div>

          {media.voteCount > 0 && (
            <div className="flex items-center gap-2">
              <MediaRating
                value={media.voteAverage}
                voteCount={media.voteCount}
                className="text-base font-semibold"
              />
              <span className="text-sm text-muted-foreground">
                ({formatCompactNumber(media.voteCount, APP_LOCALE)} votes on TMDB)
              </span>
            </div>
          )}

          {media.genres.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Genres">
              {media.genres.map((genre) => (
                <li key={genre.id}>
                  <Badge asChild variant="secondary" className="hover:bg-secondary/70">
                    <Link
                      href={routes.browse({ mediaType: media.mediaType, genreId: genre.id })}
                      title={`Browse ${genre.name.toLowerCase()} titles`}
                    >
                      {genre.name}
                    </Link>
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            {media.trailer && (
              <Button asChild>
                <a href={`#${SECTION_IDS.videos}`}>
                  <Play className="size-4 fill-current" aria-hidden />
                  Watch trailer
                </a>
              </Button>
            )}
            {actions}
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Overview</h2>
            <p lang={media.overviewLanguage ?? undefined} className="max-w-prose leading-relaxed">
              {media.overview || "No overview available."}
            </p>
            {media.overviewLanguage && (
              <p className="text-xs text-muted-foreground">
                No English overview on TMDB yet: shown in{" "}
                {formatLanguage(media.overviewLanguage, APP_LOCALE)}.
              </p>
            )}
          </div>

          {media.creators.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">
                {DETAILS_COPY[media.mediaType].creatorsPrefix}{" "}
              </span>
              <span className="font-medium">{media.creators.join(", ")}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
