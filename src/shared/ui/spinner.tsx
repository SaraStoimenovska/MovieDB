import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

type SpinnerProps = { readonly className?: string; readonly label?: string };

/** Inline spinner with an accessible label (visually hidden). */
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center">
      <Loader2 className={cn("size-6 animate-spin text-muted-foreground", className)} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Centered spinner for whole pages and page sections (route `loading.tsx`, Suspense fallbacks). */
export function PageSpinner({
  className,
  label = "Loading",
}: {
  readonly className?: string;
  readonly label?: string;
}) {
  return (
    <div className={cn("flex min-h-[40vh] w-full items-center justify-center", className)}>
      <Spinner className="size-8" label={label} />
    </div>
  );
}
