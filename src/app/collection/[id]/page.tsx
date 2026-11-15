import { type Metadata } from "next";
import {
  collectionStaticParams,
  CollectionPage,
  getCollection,
} from "@/modules/collections/server";
import { parseTmdbId } from "@/shared/lib/tmdb/ids";
import { truncate } from "@/shared/utils/text";

/** Search engines show ~155–160 characters of a description. */
const DESCRIPTION_LIMIT = 160;

export const generateStaticParams = collectionStaticParams;

export async function generateMetadata({
  params,
}: PageProps<"/collection/[id]">): Promise<Metadata> {
  const id = parseTmdbId((await params).id);
  const collection = id === null ? null : await getCollection(id);
  if (!collection) return { title: "Not found" };
  return {
    title: collection.name,
    description: truncate(collection.overview, DESCRIPTION_LIMIT) || undefined,
  };
}

export default function CollectionRoute({ params }: PageProps<"/collection/[id]">) {
  return <CollectionPage params={params} />;
}
