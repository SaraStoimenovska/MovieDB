"use client";

import { BookmarkPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { useLibraryData } from "../hooks/useLibrary";
import { selectAddable } from "../model/library";
import { useLibraryStore } from "../store/library-store";

/** "Add all to my list": puts every title without a status into "Want to watch". */
export function AddAllToListButton({ items }: { readonly items: ReadonlyArray<MediaSummary> }) {
  const { data, ready } = useLibraryData();
  const addAll = useLibraryStore((state) => state.addAllToWatchList);
  const addable = ready ? selectAddable(data, items) : items;

  if (ready && addable.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Check className="size-4" aria-hidden />
        All of these are on your list
      </p>
    );
  }

  return (
    <Button
      type="button"
      disabled={!ready}
      onClick={() => {
        addAll(addable);
        toast(`Added ${addable.length} title${addable.length === 1 ? "" : "s"} to “Want to watch”`);
      }}
    >
      <BookmarkPlus className="size-4" aria-hidden />
      Add {addable.length === items.length ? "all" : addable.length} to my list
    </Button>
  );
}
