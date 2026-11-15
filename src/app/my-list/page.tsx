import { type Metadata } from "next";
import { MyListView } from "@/modules/library";

export const metadata: Metadata = { title: "My list" };

export default function MyListPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">My list</h1>
        <p className="text-muted-foreground">
          What you want to watch next, and what you&apos;ve already seen.
        </p>
      </header>
      <MyListView />
    </div>
  );
}
