"use client";

import Link from "next/link";
import { CAROUSEL_DURATION } from "@/shared/config/timing";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";
import { toDomId } from "@/shared/utils/dom";
import { useAutoplayPlugins } from "../hooks/useAutoplayPlugins";
import { MediaCard } from "./MediaCard";

type Props = {
  readonly title: string;
  readonly items: ReadonlyArray<MediaSummary>;
  readonly href?: string;
  readonly showType?: boolean;
  /** Auto-advance one card every AUTOPLAY_DELAY_MS, looping forever. */
  readonly autoplay?: boolean;
};

/** Cards per view by breakpoint (≈2.4 on phones so the next card peeks in, hinting at scroll). */
const ITEM = "basis-[42%] sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-[12.5%]";
const CARD_SIZES = "(min-width: 1024px) 180px, 42vw";
const NAV_BUTTON =
  "top-1/3 hidden size-9 border-border/60 bg-background/90 text-foreground shadow-lg backdrop-blur-sm hover:bg-background disabled:opacity-40 sm:flex";

/** Infinite, looping card carousel (optionally auto-advancing). */
export function MediaCarousel({ title, items, href, showType = false, autoplay = false }: Props) {
  const plugins = useAutoplayPlugins(autoplay);

  if (items.length === 0) return null;
  const headingId = toDomId("carousel", title);

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            See all
          </Link>
        )}
      </div>
      <Carousel
        opts={{ loop: true, align: "start", duration: CAROUSEL_DURATION.cards }}
        plugins={plugins}
        className="group/carousel"
      >
        <CarouselContent>
          {items.map((media) => (
            <CarouselItem key={media.key} className={ITEM}>
              <MediaCard media={media} showType={showType} sizes={CARD_SIZES} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className={`left-2 ${NAV_BUTTON}`} />
        <CarouselNext className={`right-2 ${NAV_BUTTON}`} />
      </Carousel>
    </section>
  );
}
