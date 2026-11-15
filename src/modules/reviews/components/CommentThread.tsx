"use client";

import { Pencil, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDisplayName } from "@/modules/preferences";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/utils/cn";
import { useCommentActions, useCommentThread } from "../hooks/useReviews";
import {
  COMMENT_LIMITS,
  type CommentInput,
  type CommentNode,
  commentInputSchema,
  MAX_THREAD_DEPTH,
} from "../model/comments";
import { type ReviewId } from "../model/reviews";
import { CommentForm } from "./CommentForm";
import { ConfirmDelete } from "./ConfirmDelete";

const Mode = { View: "view", Reply: "reply", Edit: "edit" } as const;
type Mode = (typeof Mode)[keyof typeof Mode];

/** Indentation per depth level (capped, so deep threads stay readable on phones). */
const INDENT = ["", "ml-4 sm:ml-6", "ml-8 sm:ml-12", "ml-10 sm:ml-16"] as const;
const indentFor = (depth: number) => INDENT[Math.min(depth, MAX_THREAD_DEPTH)] ?? "";

export function CommentThread({ reviewId }: { readonly reviewId: ReviewId }) {
  const thread = useCommentThread(reviewId);
  const { add } = useCommentActions();
  const { displayName, setDisplayName } = useDisplayName();

  const post = (input: CommentInput, parentId: string | null = null) => {
    add(reviewId, parentId, input);
    setDisplayName(input.author);
  };

  return (
    <div className="space-y-4">
      {thread.length > 0 && (
        <ul className="space-y-3">
          {thread.map((node) => (
            <CommentItem
              key={node.comment.id}
              node={node}
              reviewId={reviewId}
              defaultAuthor={displayName}
              onReply={post}
            />
          ))}
        </ul>
      )}
      <CommentForm
        defaultAuthor={displayName}
        submitLabel="Comment"
        placeholder="Add a comment…"
        onSubmit={(input) => post(input)}
      />
    </div>
  );
}

type ItemProps = {
  readonly node: CommentNode;
  readonly reviewId: ReviewId;
  readonly defaultAuthor: string;
  readonly onReply: (input: CommentInput, parentId: string) => void;
};

function CommentItem({ node, reviewId, defaultAuthor, onReply }: ItemProps) {
  const { comment, depth, replies } = node;
  const format = useFormatters();
  const { edit, remove } = useCommentActions();
  const [mode, setMode] = useState<Mode>(Mode.View);
  const edited = !comment.deleted && comment.updatedAt > comment.createdAt;

  return (
    <li className={cn("space-y-3", indentFor(depth))}>
      <article className="rounded-md bg-muted/50 p-3">
        <header className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium">{comment.deleted ? "[deleted]" : comment.author}</span>
          <time
            dateTime={new Date(comment.createdAt).toISOString()}
            className="text-xs text-muted-foreground"
          >
            {format.relativeTime(comment.createdAt)}
          </time>
          {edited && <span className="text-xs text-muted-foreground">(edited)</span>}
        </header>

        {mode === Mode.Edit ? (
          <InlineEdit
            initial={comment.body}
            onCancel={() => setMode(Mode.View)}
            onSave={(body) => {
              edit(reviewId, comment.id, body);
              setMode(Mode.View);
            }}
          />
        ) : (
          // Plain text rendering: user content is never interpreted as HTML.
          <p
            className={cn(
              "mt-1 text-sm break-words whitespace-pre-line",
              comment.deleted && "text-muted-foreground italic",
            )}
          >
            {comment.deleted ? "This comment was deleted." : comment.body}
          </p>
        )}

        {!comment.deleted && mode === Mode.View && (
          <div className="mt-2 flex flex-wrap gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setMode(Mode.Reply)}
            >
              <Reply className="size-3.5" aria-hidden /> Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setMode(Mode.Edit)}
            >
              <Pencil className="size-3.5" aria-hidden /> Edit
            </Button>
            <ConfirmDelete
              title="Delete this comment?"
              description="Replies to it stay visible. This can't be undone."
              onConfirm={() => remove(reviewId, comment.id)}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive">
                  <Trash2 className="size-3.5" aria-hidden /> Delete
                </Button>
              }
            />
          </div>
        )}
      </article>

      {mode === Mode.Reply && (
        <div className={indentFor(1)}>
          <CommentForm
            defaultAuthor={defaultAuthor}
            submitLabel="Reply"
            placeholder={`Reply to ${comment.author}…`}
            autoFocus
            onCancel={() => setMode(Mode.View)}
            onSubmit={(input) => {
              onReply(input, comment.id);
              setMode(Mode.View);
            }}
          />
        </div>
      )}

      {replies.length > 0 && (
        <ul className="space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.comment.id}
              node={reply}
              reviewId={reviewId}
              defaultAuthor={defaultAuthor}
              onReply={onReply}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function InlineEdit({
  initial,
  onSave,
  onCancel,
}: {
  readonly initial: string;
  readonly onSave: (body: string) => void;
  readonly onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const parsed = commentInputSchema.shape.body.safeParse(value);
  const error = parsed.success ? null : parsed.error.issues[0]?.message;

  return (
    <div className="mt-2 space-y-2">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={2}
        maxLength={COMMENT_LIMITS.bodyMax}
        aria-label="Edit comment"
        aria-invalid={Boolean(error)}
        autoFocus
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!parsed.success}
          onClick={() => parsed.success && onSave(parsed.data)}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
