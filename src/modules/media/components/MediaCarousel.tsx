"use client";

import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import { useMemo } from "react";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";
import { MediaCard } from "./MediaCard";

/** 5s: long enough to read a title before it moves, short enough to feel alive. */
export const AUTOPLAY_DELAY_MS = 5000;

type Props = {
  readonly title: string;
  readonly items: ReadonlyArray<MediaSummary>;
  readonly href?: string;
  readonly showType?: boolean;
  /** Auto-advance one card every AUTOPLAY_DELAY_MS, looping forever. */
  readonly autoplay?: boolean;
};

const ITEM = "basis-[42%] sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-[12.5%]";

/**
 * Infinite, looping card carousel. Autoplay pauses on hover and keyboard focus (so users can
 * read and click), and is disabled entirely for users who prefer reduced motion.
 */
export function MediaCarousel({ title, items, href, showType = false, autoplay = false }: Props) {
  const reducedMotion = useReducedMotion();
  const plugins = useMemo(
    () =>
      autoplay && !reducedMotion
        ? [
            Autoplay({
              delay: AUTOPLAY_DELAY_MS,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
              stopOnFocusIn: true,
            }),
          ]
        : [],
    [autoplay, reducedMotion],
  );

  if (items.length === 0) return null;
  const headingId = `carousel-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {href && (
          <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">
            See all
          </Link>
        )}
      </div>
      <Carousel
        opts={{ loop: true, align: "start", duration: 30 }}
        plugins={plugins}
        className="group/carousel"
      >
        <CarouselContent>
          {items.map((media) => (
            <CarouselItem key={media.key} className={ITEM}>
              <MediaCard
                media={media}
                showType={showType}
                sizes="(min-width: 1024px) 180px, 42vw"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="top-1/3 left-2 hidden opacity-0 transition-opacity group-hover/carousel:opacity-100 focus-visible:opacity-100 sm:flex" />
        <CarouselNext className="top-1/3 right-2 hidden opacity-0 transition-opacity group-hover/carousel:opacity-100 focus-visible:opacity-100 sm:flex" />
      </Carousel>
    </section>
  );
}
