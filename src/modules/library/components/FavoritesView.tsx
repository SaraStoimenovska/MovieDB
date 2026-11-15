"use client";

import { Heart } from "lucide-react";
import { useMemo } from "react";
import { MediaGrid } from "@/modules/media";
import { PageSpinner } from "@/shared/ui/spinner";
import { useLibraryData } from "../hooks/useLibrary";
import { selectFavorites, snapshotToSummary } from "../model/library";
import { LibraryEmptyState } from "./LibraryEmptyState";

export function FavoritesView() {
  const { data, ready } = useLibraryData();
  const favorites = useMemo(
    () => selectFavorites(data).map((entry) => snapshotToSummary(entry.media)),
    [data],
  );

  if (!ready) return <PageSpinner label="Loading favorites" />;

  return favorites.length === 0 ? (
    <LibraryEmptyState
      icon={Heart}
      title="No favorites yet"
      description="Tap the heart on any movie or series to keep it here."
    />
  ) : (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {favorites.length} title{favorites.length === 1 ? "" : "s"}, most recently added first
      </p>
      <MediaGrid items={favorites} showType />
    </div>
  );
}
