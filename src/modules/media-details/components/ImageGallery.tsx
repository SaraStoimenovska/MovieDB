"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { type ImageAsset } from "../model/details";
import { SECTION_IDS } from "../model/presentation";

type Props = { readonly title: string; readonly images: ReadonlyArray<ImageAsset> };

const wrap = (index: number, length: number): number => (index + length) % length;

/** Backdrop strip; clicking opens a lightbox with prev/next (buttons and ← → keys). */
export function ImageGallery({ title, images }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  const current = openIndex === null ? null : images[openIndex];
  const step = (delta: number) =>
    setOpenIndex((index) => (index === null ? null : wrap(index + delta, images.length)));

  return (
    <section aria-labelledby={SECTION_IDS.images} className="space-y-3">
      <h2 id={SECTION_IDS.images} className="text-xl font-semibold tracking-tight">
        Images{" "}
        <span className="text-base font-normal text-muted-foreground">({images.length})</span>
      </h2>
      <ul className="flex snap-x gap-3 overflow-x-auto pb-4">
        {images.map((image, index) => {
          const src = tmdbImageUrl(image.path, "w780");
          return src ? (
            <li key={image.path} className="w-72 shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                className="relative block aspect-video w-full overflow-hidden rounded-lg bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={`Open image ${index + 1} of ${images.length}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  unoptimized
                  sizes="288px"
                  className="object-cover transition-transform hover:scale-105"
                />
              </button>
            </li>
          ) : null;
        })}
      </ul>

      <Dialog open={current !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent
          className="max-w-[min(96vw,1280px)] gap-3 p-3 sm:max-w-[min(96vw,1280px)]"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") step(1);
            if (event.key === "ArrowLeft") step(-1);
          }}
        >
          <DialogTitle className="text-sm font-medium">
            {title}: image {(openIndex ?? 0) + 1} of {images.length}
          </DialogTitle>
          {current && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              <Image
                src={tmdbImageUrl(current.path, "original") ?? ""}
                alt={`${title}, image ${(openIndex ?? 0) + 1}`}
                fill
                unoptimized
                sizes="96vw"
                className="object-contain"
              />
            </div>
          )}
          {images.length > 1 && (
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => step(-1)}>
                <ChevronLeft className="size-4" aria-hidden /> Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => step(1)}>
                Next <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
