import "server-only";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { parseTmdbId } from "@/shared/lib/tmdb/ids";
import { PageSpinner } from "@/shared/ui/spinner";
import { PersonView } from "./PersonView";

type Props = { readonly params: Promise<{ readonly id: string }> };

/** Route body for /person/[id]; params awaited inside Suspense (static shell + spinner). */
export function PersonPage({ params }: Props) {
  return (
    <Suspense fallback={<PageSpinner label="Loading person" />}>
      <PersonContent params={params} />
    </Suspense>
  );
}

async function PersonContent({ params }: Props) {
  const id = parseTmdbId((await params).id);
  if (id === null) notFound();
  return <PersonView id={id} />;
}
