"use client";

import { Lock, NotebookPen, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { DEBOUNCE_MS } from "@/shared/config/timing";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { type MediaKey } from "@/shared/lib/tmdb/types";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/utils/cn";
import { useNote, useNoteActions } from "../hooks/useNote";
import {
  hasUnsavedChanges,
  NOTE_MAX_LENGTH,
  NOTE_WARN_REMAINING,
  type NoteEntry,
} from "../model/notes";

type Props = { readonly mediaKey: MediaKey; readonly title: string };

const NOTES_HEADING_ID = "notes-heading";

/** Private, autosaved personal opinion about a title. Never leaves this browser. */
export function NotesSection({ mediaKey, title }: Props) {
  const { note, ready } = useNote(mediaKey);

  return (
    <section aria-labelledby={NOTES_HEADING_ID} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id={NOTES_HEADING_ID}
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <NotebookPen className="size-5" aria-hidden />
          Your notes
        </h2>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden />
          Private: only saved in this browser
        </p>
      </div>
      {ready ? (
        // Mount the editor only after hydration so its initial draft is the stored note.
        <NoteEditor key={mediaKey} mediaKey={mediaKey} title={title} initial={note} />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md border">
          <Spinner label="Loading your note" />
        </div>
      )}
    </section>
  );
}

function NoteEditor({ mediaKey, title, initial }: Props & { readonly initial: NoteEntry | null }) {
  const textareaId = useId();
  const statusId = useId();
  const format = useFormatters();
  const { note } = useNote(mediaKey);
  const { save, remove } = useNoteActions();

  const [draft, setDraft] = useState(initial?.body ?? "");
  const debouncedDraft = useDebounce(draft, DEBOUNCE_MS.autosave);
  const latestDraft = useRef(draft);

  useEffect(() => {
    latestDraft.current = draft;
  });

  // Autosave after a pause in typing (saveNote is a no-op when nothing changed).
  useEffect(() => {
    save(mediaKey, title, debouncedDraft);
  }, [debouncedDraft, mediaKey, title, save]);

  // Flush on unmount, so leaving the page right after typing never loses text.
  useEffect(() => () => save(mediaKey, title, latestDraft.current), [mediaKey, title, save]);

  const unsaved = hasUnsavedChanges(draft, note);
  const remaining = NOTE_MAX_LENGTH - draft.length;
  const status = unsaved
    ? "Saving…"
    : note
      ? `Saved ${format.relativeTime(note.updatedAt)}`
      : "Start typing: your note saves automatically.";

  const onDelete = () => {
    setDraft("");
    remove(mediaKey);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={textareaId} className="sr-only">
        Your private notes about {title}
      </label>
      <Textarea
        id={textareaId}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => save(mediaKey, title, draft)}
        maxLength={NOTE_MAX_LENGTH}
        rows={5}
        placeholder={`What did you think of ${title}? Favourite scenes, who you'd recommend it to…`}
        aria-describedby={statusId}
        className="min-h-32 resize-y"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p id={statusId} aria-live="polite">
          {status}
        </p>
        <div className="flex items-center gap-3">
          <span
            className={cn("tabular-nums", remaining <= NOTE_WARN_REMAINING && "text-destructive")}
          >
            {remaining} characters left
          </span>
          {(note || draft) && (
            <Button type="button" variant="ghost" size="sm" onClick={onDelete} className="h-7 px-2">
              <Trash2 className="size-3.5" aria-hidden />
              Clear note
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
