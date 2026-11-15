import "server-only";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { parseTmdbId } from "@/shared/lib/tmdb/ids";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { PageSpinner } from "@/shared/ui/spinner";
import { getCollection } from "../api/server";
import { CollectionParts } from "./CollectionParts";

type Props = { readonly params: Promise<{ readonly id: string }> };

/** Route body for /collection/[id]; params awaited inside Suspense (static shell + spinner). */
export function CollectionPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSpinner label="Loading collection" />}>
      <CollectionContent params={params} />
    </Suspense>
  );
}

async function CollectionContent({ params }: Props) {
  const id = parseTmdbId((await params).id);
  const collection = id === null ? null : await getCollection(id);
  if (!collection) notFound();

  const backdrop = tmdbImageUrl(collection.backdropPath, "w1280");

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-xl border bg-muted/40">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover opacity-25"
          />
        )}
        <div className="relative space-y-3 p-6 sm:p-10">
          <p className="text-sm font-medium text-muted-foreground">Collection</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{collection.name}</h1>
          {collection.overview && (
            <p className="max-w-prose leading-relaxed">{collection.overview}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {collection.parts.length} film{collection.parts.length === 1 ? "" : "s"}, in release
            order
          </p>
        </div>
      </header>
      <CollectionParts name={collection.name} parts={collection.parts} layout="grid" />
    </div>
  );
}
