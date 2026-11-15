"use client";

import { useEffect } from "react";
import { Button } from "@/shared/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert" className="mx-auto max-w-md space-y-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">
        We couldn&apos;t load this page. TMDB may be unavailable, so please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </section>
  );
}
