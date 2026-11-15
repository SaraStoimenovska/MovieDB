"use client";

import { Bookmark, BookmarkCheck, Check, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { type MediaSummary } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/utils/cn";
import { useLibraryActions, useLibraryEntry } from "../hooks/useLibrary";
import { WATCH_STATUS_LABELS, WATCH_STATUSES, type WatchStatus } from "../model/library";

const STATUS_ICONS = { to_watch: Bookmark, watched: Eye } as const;

type Props = { readonly media: MediaSummary; readonly variant?: "icon" | "full" };

/** "Want to watch" / "Watched" picker; choosing the current status again removes it. */
export function WatchStatusMenu({ media, variant = "full" }: Props) {
  const entry = useLibraryEntry(media.key);
  const { setStatus } = useLibraryActions();
  const status = entry?.status ?? null;

  const choose = (next: WatchStatus | null) => {
    const previous = status;
    setStatus(media, next);
    const resulting = previous === next ? null : next;
    toast(resulting ? `Marked as "${WATCH_STATUS_LABELS[resulting]}"` : "Removed from your list", {
      description: media.title,
      action: { label: "Undo", onClick: () => setStatus(media, previous) },
    });
  };

  const TriggerIcon = status === "watched" ? Eye : status === "to_watch" ? BookmarkCheck : Bookmark;
  const triggerLabel = status ? WATCH_STATUS_LABELS[status] : "Add to list";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={`${triggerLabel}: ${media.title}`}
            title={triggerLabel}
            className="size-8 rounded-full bg-background/80 shadow backdrop-blur hover:bg-background"
          >
            <TriggerIcon className={cn("size-4", status && "fill-primary/20 text-primary")} />
          </Button>
        ) : (
          <Button type="button" variant="outline">
            <TriggerIcon className={cn("size-4", status && "text-primary")} />
            {triggerLabel}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {WATCH_STATUSES.map((option) => {
          const Icon = STATUS_ICONS[option];
          return (
            <DropdownMenuItem key={option} onSelect={() => choose(option)}>
              <Icon className="size-4" />
              {WATCH_STATUS_LABELS[option]}
              {status === option && <Check className="ml-auto size-4" aria-label="Selected" />}
            </DropdownMenuItem>
          );
        })}
        {status && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => choose(null)} variant="destructive">
              <Trash2 className="size-4" />
              Remove from list
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
