import { type Metadata } from "next";
import { Suspense } from "react";
import { PreferencesForm } from "@/modules/preferences";
import { getWatchRegions } from "@/modules/preferences/server";
import { PageSpinner } from "@/shared/ui/spinner";
import { AppDataManagement } from "./_components/AppDataManagement";

export const metadata: Metadata = { title: "Preferences" };

export default function PreferencesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground">
          Personalize the app. Everything is saved in this browser.
        </p>
      </header>
      <Suspense fallback={<PageSpinner label="Loading preferences" />}>
        <PreferencesSettings />
      </Suspense>
      <AppDataManagement />
    </div>
  );
}

async function PreferencesSettings() {
  return <PreferencesForm regions={await getWatchRegions()} />;
}
