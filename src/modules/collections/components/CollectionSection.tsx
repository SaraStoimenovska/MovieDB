import "server-only";
import { ChevronRight, Library } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { getCollection } from "../api/server";
import { CollectionParts } from "./CollectionParts";

/** A collection with a single film isn't a franchise worth a section. */
const MIN_PARTS = 2;

type Props = {
  readonly collectionId: number;
  /** The movie whose details page this is on. */
  readonly currentId: number;
};

/** "Part of the … Collection" on a movie's details page: the other films + your progress. */
export async function CollectionSection({ collectionId, currentId }: Props) {
  const collection = await getCollection(collectionId);
  if (!collection || collection.parts.length < MIN_PARTS) return null;

  return (
    <section aria-labelledby="collection-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="collection-heading"
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <Library className="size-5" aria-hidden />
          Part of {collection.name}
        </h2>
        <Link
          href={routes.collection(collection.id)}
          className="inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
        >
          All {collection.parts.length} films
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      <CollectionParts
        name={collection.name}
        parts={collection.parts}
        currentId={currentId}
        layout="row"
      />
    </section>
  );
}
