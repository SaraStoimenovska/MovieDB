"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MediaRating, useAutoplayPlugins } from "@/modules/media";
import { APP_LOCALE } from "@/shared/config/app";
import { routes } from "@/shared/config/routes";
import { CAROUSEL_DURATION } from "@/shared/config/timing";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { MEDIA_TYPE_LABELS, type MediaSummary } from "@/shared/lib/tmdb/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";
import { formatYear } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";

const NAV_BUTTON =
  "hidden size-10 border-border/60 bg-background/90 text-foreground shadow-lg backdrop-blur-sm hover:bg-background disabled:opacity-40 md:flex";

/** Big backdrop carousel for "Trending today": one slide at a time, looping forever. */
export function TrendingHero({ items }: { readonly items: ReadonlyArray<MediaSummary> }) {
  const plugins = useAutoplayPlugins();
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const slides = useMemo(() => items.filter((item) => item.backdropPath), [items]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (slides.length === 0) return null;

  return (
    <section aria-roledescription="carousel" aria-label="Trending today" className="space-y-2">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, duration: CAROUSEL_DURATION.hero }}
        plugins={plugins}
        className="group/hero"
      >
        <CarouselContent>
          {slides.map((media, index) => (
            <CarouselItem key={media.key} aria-label={`${index + 1} of ${slides.length}`}>
              <HeroSlide media={media} priority={index === 0} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className={`left-4 ${NAV_BUTTON}`} />
        <CarouselNext className={`right-4 ${NAV_BUTTON}`} />
      </Carousel>

      <div className="flex flex-wrap justify-center" role="group" aria-label="Choose slide">
        {slides.map((media, index) => (
          // Padding gives each dot a comfortable touch target while the dot itself stays small.
          <button
            key={media.key}
            type="button"
            onClick={() => api?.scrollTo(index)}
            aria-label={`Show ${media.title}`}
            aria-current={index === selected}
            className="group/dot p-1.5"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all",
                index === selected
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/40 group-hover/dot:bg-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

function HeroSlide({
  media,
  priority,
}: {
  readonly media: MediaSummary;
  readonly priority: boolean;
}) {
  const backdrop = tmdbImageUrl(media.backdropPath, "w1280");
  const year = formatYear(media.releaseDate, APP_LOCALE);

  return (
    // Taller on phones so long titles + button fit; cinematic 21:9 on large screens.
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-video lg:aspect-[21/9]">
      {backdrop && (
        <Image
          src={backdrop}
          alt=""
          fill
          priority={priority}
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white sm:p-8 md:max-w-2xl">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">{MEDIA_TYPE_LABELS[media.mediaType]}</Badge>
          {year && <span>{year}</span>}
          <MediaRating value={media.voteAverage} voteCount={media.voteCount} />
        </div>
        <h2 className="line-clamp-2 text-xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          {media.title}
        </h2>
        {media.overview && (
          <p className="line-clamp-2 hidden text-sm text-white/85 sm:block sm:text-base">
            {media.overview}
          </p>
        )}
        <Button asChild size="sm" className="mt-1 sm:mt-2">
          <Link href={routes.media(media.mediaType, media.id)}>View details</Link>
        </Button>
      </div>
    </div>
  );
}
