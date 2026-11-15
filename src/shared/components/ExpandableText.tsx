"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";
import { truncate } from "@/shared/utils/text";

type Props = {
  readonly text: string;
  /** Characters shown before "Read more". */
  readonly previewChars: number;
  readonly className?: string;
};

/** Long text (bios, reviews) with a Read more / Show less toggle. Rendered as plain text. */
export function ExpandableText({ text, previewChars, className }: Props) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > previewChars;

  return (
    <div className="space-y-1">
      <p className={cn("leading-relaxed whitespace-pre-line", className)}>
        {expanded || !long ? text : truncate(text, previewChars)}
      </p>
      {long && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
        </Button>
      )}
    </div>
  );
}
