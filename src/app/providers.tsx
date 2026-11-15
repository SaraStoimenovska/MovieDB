"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useState } from "react";
import { EpisodesSync } from "@/modules/episodes";
import { CardLibraryActions, LibrarySync } from "@/modules/library";
import { MediaCardActionsProvider, type MediaCardActionsRenderer } from "@/modules/media";
import { NotesSync } from "@/modules/notes";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/modules/preferences";
import { ReviewsSync } from "@/modules/reviews";
import { makeQueryClient } from "@/shared/lib/query-client";
import { Toaster } from "@/shared/ui/sonner";

/** Module-level, so the context value is stable and cards don't re-render on provider renders. */
const renderCardActions: MediaCardActionsRenderer = (media) => <CardLibraryActions media={media} />;

export function Providers({ children }: { readonly children: ReactNode }) {
  // One client per browser session; useState keeps it stable without module-level mutable state.
  const [queryClient] = useState(makeQueryClient);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME}
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
    >
      <QueryClientProvider client={queryClient}>
        {/* The app decides which actions every media card shows: here, the library buttons. */}
        <MediaCardActionsProvider render={renderCardActions}>{children}</MediaCardActionsProvider>
        {/* Keep localStorage-backed stores in sync across open tabs. */}
        <LibrarySync />
        <EpisodesSync />
        <NotesSync />
        <ReviewsSync />
        <Toaster position="bottom-right" closeButton />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools buttonPosition="bottom-left" />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
