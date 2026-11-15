import { type ReactNode } from "react";
import { Label } from "@/shared/ui/label";

type Props = {
  readonly id: string;
  readonly label: string;
  readonly error?: string;
  readonly hint?: ReactNode;
  readonly children: ReactNode;
};

/** Label + control + error message, wired with ids the control references via aria-describedby. */
export function FormField({ id, label, error, hint, children }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={errorId(id)} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export const errorId = (fieldId: string): string => `${fieldId}-error`;
