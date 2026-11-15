"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  COMMENT_LIMITS,
  type CommentFormValues,
  type CommentInput,
  commentInputSchema,
} from "../model/comments";
import { REVIEW_LIMITS } from "../model/reviews";
import { errorId } from "./FormField";

type Props = {
  readonly defaultAuthor: string;
  readonly submitLabel: string;
  readonly placeholder: string;
  readonly onSubmit: (input: CommentInput) => void;
  readonly onCancel?: () => void;
  readonly autoFocus?: boolean;
};

/** Compact comment / reply form: name + text. Resets after a successful post. */
export function CommentForm({
  defaultAuthor,
  submitLabel,
  placeholder,
  onSubmit,
  onCancel,
  autoFocus = false,
}: Props) {
  const authorId = useId();
  const bodyId = useId();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormValues, unknown, CommentInput>({
    resolver: zodResolver(commentInputSchema),
    defaultValues: { author: defaultAuthor, body: "" },
  });

  const submit = (input: CommentInput) => {
    onSubmit(input);
    reset({ author: input.author, body: "" });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-2" aria-label={submitLabel}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="sm:w-40">
          <label htmlFor={authorId} className="sr-only">
            Your name
          </label>
          <Input
            id={authorId}
            {...register("author")}
            placeholder="Your name"
            maxLength={REVIEW_LIMITS.authorMax}
            autoComplete="nickname"
            aria-invalid={Boolean(errors.author)}
            aria-describedby={errors.author ? errorId(authorId) : undefined}
            className="h-9"
          />
          {errors.author && (
            <p id={errorId(authorId)} role="alert" className="mt-1 text-xs text-destructive">
              {errors.author.message}
            </p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor={bodyId} className="sr-only">
            {placeholder}
          </label>
          <Textarea
            id={bodyId}
            {...register("body")}
            placeholder={placeholder}
            rows={2}
            maxLength={COMMENT_LIMITS.bodyMax}
            autoFocus={autoFocus}
            aria-invalid={Boolean(errors.body)}
            aria-describedby={errors.body ? errorId(bodyId) : undefined}
            className="min-h-16 resize-y"
          />
          {errors.body && (
            <p id={errorId(bodyId)} role="alert" className="mt-1 text-xs text-destructive">
              {errors.body.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
