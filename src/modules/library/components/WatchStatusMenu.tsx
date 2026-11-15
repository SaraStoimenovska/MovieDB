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
import {
  type MediaExtras,
  WATCH_STATUS_LABELS,
  WATCH_STATUSES,
  WatchStatus,
} from "../model/library";
import { ActionVariant, OVERLAY_ICON_BUTTON } from "./action-variant";
import { WATCH_STATUS_ICONS } from "./status-icons";

/** Trigger icon: filled bookmark once something is planned, eye once watched. */
const TRIGGER_ICONS = {
  none: Bookmark,
  [WatchStatus.ToWatch]: BookmarkCheck,
  [WatchStatus.Watched]: Eye,
} as const;

type Props = {
  readonly media: MediaSummary;
  readonly variant?: ActionVariant;
  readonly extras?: MediaExtras;
};

/** "Want to watch" / "Watched" picker; choosing the current status again removes it. */
export function WatchStatusMenu({ media, variant = ActionVariant.Full, extras }: Props) {
  const entry = useLibraryEntry(media.key);
  const { setStatus } = useLibraryActions();
  const status = entry?.status ?? null;

  const choose = (next: WatchStatus | null) => {
    const previous = status;
    setStatus(media, next, extras);
    const resulting = previous === next ? null : next;
    toast(resulting ? `Marked as "${WATCH_STATUS_LABELS[resulting]}"` : "Removed from your list", {
      description: media.title,
      action: { label: "Undo", onClick: () => setStatus(media, previous, extras) },
    });
  };

  const TriggerIcon = TRIGGER_ICONS[status ?? "none"];
  const triggerLabel = status ? WATCH_STATUS_LABELS[status] : "Add to list";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === ActionVariant.Icon ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={`${triggerLabel}: ${media.title}`}
            title={triggerLabel}
            className={OVERLAY_ICON_BUTTON}
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
          const Icon = WATCH_STATUS_ICONS[option];
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
