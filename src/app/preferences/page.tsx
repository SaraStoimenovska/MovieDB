import { Settings } from "lucide-react";
import { type Metadata } from "next";

export const metadata: Metadata = { title: "Preferences" };

/** Placeholder: preferences (display name, region, data export/import…) come later. */
export default function PreferencesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground">Personalize how the app works for you.</p>
      </header>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <Settings className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">Coming soon</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Settings will appear here. For now, switch light/dark mode from the header.
        </p>
      </div>
    </div>
  );
}
