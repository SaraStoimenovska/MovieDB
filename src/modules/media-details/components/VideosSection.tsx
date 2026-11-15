"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/utils/cn";
import { type Video } from "../model/details";
import { SECTION_IDS } from "../model/presentation";

const VIDEOS_HEADING_ID = `-heading`;

const thumbnail = (key: string, quality: "hqdefault" | "mqdefault" = "hqdefault") =>
  `https://i.ytimg.com/vi/${encodeURIComponent(key)}/${quality}.jpg`;

/**
 * Player + playlist. The player is a facade: a thumbnail until the user presses play, so the
 * heavy YouTube iframe (and its tracking) only loads on demand. Uses youtube-nocookie.
 */
export function VideosSection({ videos }: { readonly videos: ReadonlyArray<Video> }) {
  const [current, setCurrent] = useState<Video | null>(videos[0] ?? null);
  const [playing, setPlaying] = useState(false);
  if (!current) return null;

  const select = (video: Video) => {
    setCurrent(video);
    setPlaying(true);
  };

  return (
    <section
      id={SECTION_IDS.videos}
      aria-labelledby={VIDEOS_HEADING_ID}
      className="scroll-mt-24 space-y-4"
    >
      <h2 id={VIDEOS_HEADING_ID} className="text-xl font-semibold tracking-tight">
        Videos{" "}
        <span className="text-base font-normal text-muted-foreground">({videos.length})</span>
      </h2>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          {playing ? (
            <iframe
              key={current.key}
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(current.key)}?autoplay=1&rel=0`}
              title={current.name}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={`Play ${current.name}`}
            >
              {/* Third-party thumbnail: not worth routing through next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnail(current.key)}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-black/70 text-white transition-transform group-hover:scale-110">
                <Play className="size-7 translate-x-0.5 fill-current" aria-hidden />
              </span>
            </button>
          )}
        </div>

        {videos.length > 1 && (
          <ul className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[min(60vh,28rem)] lg:flex-col lg:overflow-y-auto lg:pr-1 lg:pb-0">
            {videos.map((video) => {
              const active = video.key === current.key;
              return (
                <li key={video.key} className="w-48 shrink-0 lg:w-auto">
                  <button
                    type="button"
                    onClick={() => select(video)}
                    aria-current={active}
                    className={cn(
                      "flex w-full flex-col gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-accent lg:flex-row",
                      active && "bg-accent",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnail(video.key, "mqdefault")}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full shrink-0 rounded object-cover lg:w-32"
                    />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-medium">{video.name}</span>
                      <span className="text-xs text-muted-foreground">{video.type}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
