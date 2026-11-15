"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { routes } from "@/shared/config/routes";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { encodeSharedList, MAX_SHARED_ITEMS } from "../model/shared-list";

type Props = {
  readonly name: string;
  /** In the order they should appear (what the user currently sees). */
  readonly keys: ReadonlyArray<MediaKey>;
};

/**
 * Shares a link to this list. Uses the system share sheet where there is one (phones),
 * otherwise copies the link. The list is in the link itself: nothing is uploaded.
 */
export function ShareListButton({ name, keys }: Props) {
  const share = async () => {
    const url = new URL(routes.shared(encodeSharedList(name, keys)), window.location.origin).href;
    const capped = keys.length > MAX_SHARED_ITEMS;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link copied", {
        description: capped
          ? `The link contains the first ${MAX_SHARED_ITEMS} titles.`
          : "Anyone with the link can see this list.",
      });
    } catch (error) {
      // Closing the share sheet isn't an error worth reporting.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Couldn't share the list", {
        description: "Copy the link from the address bar instead.",
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void share()}
      disabled={keys.length === 0}
    >
      <Share2 className="size-4" aria-hidden />
      Share
    </Button>
  );
}
