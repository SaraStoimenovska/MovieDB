"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MediaPoster } from "@/modules/media";
import { APP_LOCALE } from "@/shared/config/app";
import { routes } from "@/shared/config/routes";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Command, CommandGroup, CommandItem, CommandList } from "@/shared/ui/command";
import { Spinner } from "@/shared/ui/spinner";
import { formatYear } from "@/shared/utils/format";
import { useSearchSuggestions } from "../hooks/useSearchSuggestions";
import { isSearchable, MAX_QUERY_LENGTH, normalizeQuery } from "../model/search";

const SEARCH_ALL = "__search_all__";

/**
 * Header search. Remounted (via `key`) whenever the user leaves for another page, so the field
 * resets after navigation, but keeps its state while on /search, where it drives the results.
 */
export function HeaderSearch() {
  const pathname = usePathname();
  const onSearchPage = pathname === routes.search();
  return (
    <HeaderSearchField key={onSearchPage ? "search-page" : pathname} onSearchPage={onSearchPage} />
  );
}

function HeaderSearchField({ onSearchPage }: { readonly onSearchPage: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = normalizeQuery(searchParams.get("q"));
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState(onSearchPage ? urlQuery : "");
  const [focused, setFocused] = useState(false);
  const query = normalizeQuery(useDebounce(input, 300));

  // On /search the field drives the results page directly, so no dropdown there.
  const suggestions = useSearchSuggestions(query, !onSearchPage);
  const open = focused && !onSearchPage && isSearchable(normalizeQuery(input));

  useEffect(() => {
    if (!onSearchPage || query === urlQuery) return;
    router.replace(routes.search(query), { scroll: false });
  }, [onSearchPage, query, urlQuery, router]);

  // "/" focuses search from anywhere (unless the user is already typing somewhere).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable='true']");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setFocused(false);
    inputRef.current?.blur();
    router.push(href);
  };

  const submittedQuery = normalizeQuery(input);

  return (
    <Command
      shouldFilter={false}
      loop
      label="Search movies and series"
      className="relative overflow-visible bg-transparent"
      onKeyDown={(event) => {
        if (event.key === "Escape") inputRef.current?.blur();
      }}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <CommandPrimitive.Input
          ref={inputRef}
          value={input}
          onValueChange={setInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={MAX_QUERY_LENGTH}
          placeholder="Search movies and series…"
          className="h-9 w-full rounded-md border border-input bg-muted/50 pr-10 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:block">
          /
        </kbd>
      </div>

      {open && (
        <CommandList
          // Keep focus in the input while clicking a result (otherwise blur closes the list first).
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-x-0 top-11 z-50 max-h-[70vh] rounded-md border bg-popover shadow-lg"
        >
          <CommandGroup>
            <CommandItem value={SEARCH_ALL} onSelect={() => go(routes.search(submittedQuery))}>
              <Search className="size-4" />
              <span>
                Search for <strong>&ldquo;{submittedQuery}&rdquo;</strong>
              </span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Top results">
            {suggestions.isFetching && !suggestions.data && (
              <div className="flex justify-center py-4">
                <Spinner label="Loading suggestions" />
              </div>
            )}
            {suggestions.isError && (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                Couldn&apos;t load suggestions.
              </p>
            )}
            {suggestions.data?.length === 0 && !suggestions.isFetching && (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No matches yet. Press Enter to search.
              </p>
            )}
            {suggestions.data?.map((media) => (
              <CommandItem
                key={media.key}
                value={media.key}
                onSelect={() => go(routes.media(media.mediaType, media.id))}
                className="gap-3"
              >
                <MediaPoster
                  path={media.posterPath}
                  title={media.title}
                  size="w185"
                  sizes="32px"
                  className="w-8 shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{media.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      media.mediaType === "movie" ? "Movie" : "Series",
                      formatYear(media.releaseDate, APP_LOCALE),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      )}
    </Command>
  );
}

/** Static placeholder with identical size, rendered until the client field hydrates. */
export function HeaderSearchFallback() {
  return (
    <div className="relative" aria-hidden>
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 pl-9 text-sm text-muted-foreground">
        Search movies and series…
      </div>
    </div>
  );
}
