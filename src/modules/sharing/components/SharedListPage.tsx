import "server-only";
import { Link2Off, Share2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { MediaGrid } from "@/modules/media";
import { routes } from "@/shared/config/routes";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { PageSpinner } from "@/shared/ui/spinner";
import { resolveSharedList } from "../api/server";
import { decodeSharedList } from "../model/shared-list";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Props = {
  readonly searchParams: SearchParams;
  /** Extra actions for the whole list (the app plugs in "Add all to my list"). */
  readonly renderActions?: (items: ReadonlyArray<MediaSummary>) => ReactNode;
};

/** Route body for /shared; the list is read from the link inside Suspense (request-time). */
export function SharedListPage({ searchParams, renderActions }: Props) {
  return (
    <Suspense fallback={<PageSpinner label="Loading shared list" />}>
      <SharedListContent searchParams={searchParams} renderActions={renderActions} />
    </Suspense>
  );
}

async function SharedListContent({ searchParams, renderActions }: Props) {
  const list = decodeSharedList(await searchParams);
  const items = list ? await resolveSharedList(list) : [];

  if (!list || items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Link2Off className="size-6 text-muted-foreground" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold">This link doesn&apos;t contain a list</h1>
        <p className="text-muted-foreground">
          It may have been cut off when it was copied. Ask for the link again.
        </p>
        <Button asChild className="mt-2">
          <Link href={routes.home()}>Go to the home page</Link>
        </Button>
      </div>
    );
  }

  const missing = list.items.length - items.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Share2 className="size-4" aria-hidden />
            Shared with you
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{list.name}</h1>
          <p className="text-muted-foreground">
            {items.length} title{items.length === 1 ? "" : "s"}
            {missing > 0 && ` (${missing} no longer available on TMDB)`}
          </p>
        </div>
        {renderActions?.(items)}
      </header>
      <MediaGrid items={items} showType />
    </div>
  );
}
