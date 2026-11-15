import { type Metadata } from "next";
import { FavoritesView } from "@/modules/library";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground">Movies and series you love, saved in this browser.</p>
      </header>
      <FavoritesView />
    </div>
  );
}
