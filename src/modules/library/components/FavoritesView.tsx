"use client";

import { Heart } from "lucide-react";
import { useMemo } from "react";
import { PageSpinner } from "@/shared/ui/spinner";
import { useLibraryData } from "../hooks/useLibrary";
import { type LibraryEntry, selectFavorites } from "../model/library";
import { LibraryCollection } from "./LibraryCollection";
import { LibraryEmptyState } from "./LibraryEmptyState";

const favoritedAt = (entry: LibraryEntry) => entry.favoritedAt;

type Props = { readonly genreNames: Readonly<Record<number, string>> };

export function FavoritesView({ genreNames }: Props) {
  const { data, ready } = useLibraryData();
  const favorites = useMemo(() => selectFavorites(data), [data]);

  if (!ready) return <PageSpinner label="Loading favorites" />;

  return favorites.length === 0 ? (
    <LibraryEmptyState
      icon={Heart}
      title="No favorites yet"
      description="Tap the heart on any movie or series to keep it here."
    />
  ) : (
    <LibraryCollection
      entries={favorites}
      addedAt={favoritedAt}
      genreNames={genreNames}
      listLabel="Favorites"
    />
  );
}
