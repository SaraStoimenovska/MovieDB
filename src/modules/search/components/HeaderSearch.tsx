"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startNavigation } from "@/shared/lib/navigation-progress";
import { useEffect, useRef, useState } from "react";
import { MediaPoster, mediaMetaLine } from "@/modules/media";
import { APP_LOCALE } from "@/shared/config/app";
import { QueryParam, routes } from "@/shared/config/routes";
import { DEBOUNCE_MS } from "@/shared/config/timing";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useHotkey } from "@/shared/hooks/useHotkey";
import { Command, CommandGroup, CommandItem, CommandList } from "@/shared/ui/command";
import { Spinner } from "@/shared/ui/spinner";
import { useSearchSuggestions } from "../hooks/useSearchSuggestions";
import { isSearchable, MAX_QUERY_LENGTH, normalizeQuery, SEARCH_HOTKEY } from "../model/search";

/** cmdk item value of the "Search for …" row (never collides with a MediaKey). */
const SEARCH_ALL = "__search_all__";
const SEARCH_PAGE_KEY = "search-page";
const PLACEHOLDER = "Search movies and series…";

/**
 * Header search. Remounted (via `key`) whenever the user leaves for another page, so the field
 * resets after navigation, but keeps its state while on /search, where it drives the results.
 */
export function HeaderSearch() {
  const pathname = usePathname();
  const onSearchPage = pathname === routes.search();
  return (
    <HeaderSearchField
      key={onSearchPage ? SEARCH_PAGE_KEY : pathname}
      onSearchPage={onSearchPage}
    />
  );
}

function HeaderSearchField({ onSearchPage }: { readonly onSearchPage: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = normalizeQuery(searchParams.get(QueryParam.Search));
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState(onSearchPage ? urlQuery : "");
  const [focused, setFocused] = useState(false);
  const query = normalizeQuery(useDebounce(input, DEBOUNCE_MS.search));

  // On /search the field drives the results page directly, so no dropdown there.
  const suggestions = useSearchSuggestions(query, !onSearchPage);
  const open = focused && !onSearchPage && isSearchable(normalizeQuery(input));

  useEffect(() => {
    if (!onSearchPage || query === urlQuery) return;
    router.replace(routes.search(query), { scroll: false });
  }, [onSearchPage, query, urlQuery, router]);

  // "/" focuses search from anywhere (unless the user is already typing somewhere).
  useHotkey(SEARCH_HOTKEY, () => inputRef.current?.focus());

  const go = (href: string) => {
    setFocused(false);
    inputRef.current?.blur();
    // Suggestions navigate programmatically, so tell the top progress bar explicitly.
    startNavigation(`${window.location.pathname}${window.location.search}`);
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
          placeholder={PLACEHOLDER}
          aria-label={PLACEHOLDER}
          // cmdk always reports "expanded"; tell assistive tech the real state.
          aria-expanded={open}
          // The "/" shortcut still works; it's announced to assistive tech instead of drawn in the field.
          aria-keyshortcuts={SEARCH_HOTKEY}
          className="h-9 w-full rounded-md border border-input bg-muted/50 pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      {/* Always mounted (hidden when closed) so the input's aria-controls points at a real element. */}
      <CommandList
        hidden={!open}
        // Keep focus in the input while clicking a result (otherwise blur closes the list first).
        onMouseDown={(event) => event.preventDefault()}
        className="absolute inset-x-0 top-11 z-50 max-h-[70vh] rounded-md border bg-popover shadow-lg"
      >
        {open && (
          <>
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
                    decorative
                    sizes="32px"
                    className="w-8 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{media.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {mediaMetaLine(media, APP_LOCALE)}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}

/** Static placeholder with identical size, rendered until the client field hydrates. */
export function HeaderSearchFallback() {
  return (
    <div className="relative" aria-hidden>
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 pl-9 text-sm text-muted-foreground">
        {PLACEHOLDER}
      </div>
    </div>
  );
}
