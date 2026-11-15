"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { RatingInput } from "@/shared/components/RatingInput";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  REVIEW_LIMITS,
  type ReviewFormValues,
  type ReviewInput,
  reviewInputSchema,
} from "../model/reviews";
import { errorId, FormField } from "./FormField";

type Props = {
  readonly defaultValues: ReviewFormValues;
  readonly submitLabel: string;
  readonly onSubmit: (input: ReviewInput) => void;
  readonly onCancel: () => void;
};

/** Create/edit form. Validation = the store's own zod schema, so form and data never disagree. */
export function ReviewForm({ defaultValues, submitLabel, onSubmit, onCancel }: Props) {
  const ids = { author: useId(), title: useId(), body: useId(), rating: useId() };
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues, unknown, ReviewInput>({
    resolver: zodResolver(reviewInputSchema),
    defaultValues,
    mode: "onTouched",
  });
  // useWatch (not watch()) is the React-Compiler-friendly subscription.
  const bodyLength = useWatch({ control, name: "body" }).length;

  const aria = (field: keyof typeof ids, invalid: boolean) => ({
    id: ids[field],
    "aria-invalid": invalid,
    "aria-describedby": invalid ? errorId(ids[field]) : undefined,
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
      aria-label={submitLabel}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={ids.author} label="Your name" error={errors.author?.message}>
          <Input
            {...aria("author", Boolean(errors.author))}
            {...register("author")}
            maxLength={REVIEW_LIMITS.authorMax}
            autoComplete="nickname"
          />
        </FormField>
        <div>
          <Controller
            control={control}
            name="rating"
            render={({ field }) => (
              <RatingInput
                value={Number(field.value) || 0}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.rating)}
                describedBy={errors.rating ? errorId(ids.rating) : undefined}
              />
            )}
          />
          {errors.rating && (
            <p id={errorId(ids.rating)} role="alert" className="mt-1.5 text-sm text-destructive">
              {errors.rating.message}
            </p>
          )}
        </div>
      </div>

      <FormField id={ids.title} label="Title (optional)" error={errors.title?.message}>
        <Input
          {...aria("title", Boolean(errors.title))}
          {...register("title")}
          maxLength={REVIEW_LIMITS.titleMax}
          placeholder="Sum it up in a line"
        />
      </FormField>

      <FormField
        id={ids.body}
        label="Review"
        error={errors.body?.message}
        hint={`${bodyLength}/${REVIEW_LIMITS.bodyMax}`}
      >
        <Textarea
          {...aria("body", Boolean(errors.body))}
          {...register("body")}
          rows={5}
          maxLength={REVIEW_LIMITS.bodyMax}
          placeholder="What worked, what didn't, and who should watch it?"
          className="min-h-32 resize-y"
        />
      </FormField>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
