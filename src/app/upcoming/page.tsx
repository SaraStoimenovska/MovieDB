import { type Metadata } from "next";
import { UpcomingView } from "@/modules/upcoming";

export const metadata: Metadata = { title: "Upcoming" };

export default function UpcomingPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Upcoming</h1>
        <p className="text-muted-foreground">
          Release dates and new episodes for titles on your list.
        </p>
      </header>
      <UpcomingView />
    </div>
  );
}
