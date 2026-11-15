"use client";

import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AUTOPLAY_DELAY_MS, MediaRating } from "@/modules/media";
import { APP_LOCALE } from "@/shared/config/app";
import { routes } from "@/shared/config/routes";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
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

/** Big backdrop carousel for "Trending today": one slide at a time, looping forever every 5s. */
export function TrendingHero({ items }: { readonly items: ReadonlyArray<MediaSummary> }) {
  const reducedMotion = useReducedMotion();
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const slides = useMemo(() => items.filter((item) => item.backdropPath), [items]);

  const plugins = useMemo(
    () =>
      reducedMotion
        ? []
        : [
            Autoplay({
              delay: AUTOPLAY_DELAY_MS,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
              stopOnFocusIn: true,
            }),
          ],
    [reducedMotion],
  );

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
    <section aria-roledescription="carousel" aria-label="Trending today" className="space-y-3">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, duration: 35 }}
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
        <CarouselPrevious className="left-4 hidden opacity-0 transition-opacity group-hover/hero:opacity-100 focus-visible:opacity-100 md:flex" />
        <CarouselNext className="right-4 hidden opacity-0 transition-opacity group-hover/hero:opacity-100 focus-visible:opacity-100 md:flex" />
      </Carousel>

      <div className="flex justify-center gap-1.5" role="group" aria-label="Choose slide">
        {slides.map((media, index) => (
          <button
            key={media.key}
            type="button"
            onClick={() => api?.scrollTo(index)}
            aria-label={`Show ${media.title}`}
            aria-current={index === selected}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === selected
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground",
            )}
          />
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
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted sm:aspect-[21/9]">
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
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">{media.mediaType === "movie" ? "Movie" : "Series"}</Badge>
          {year && <span>{year}</span>}
          <MediaRating value={media.voteAverage} voteCount={media.voteCount} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">{media.title}</h2>
        {media.overview && (
          <p className="line-clamp-2 hidden text-sm text-white/85 sm:block sm:text-base">
            {media.overview}
          </p>
        )}
        <Button asChild size="sm" className="mt-2">
          <Link href={routes.media(media.mediaType, media.id)}>View details</Link>
        </Button>
      </div>
    </div>
  );
}
