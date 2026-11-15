import { cn } from "@/shared/utils/cn";

type Props = { readonly percent: number; readonly label: string; readonly className?: string };

/** Accessible progress bar (role=progressbar with value + text). */
export function ProgressBar({ percent, label, className }: Props) {
  const value = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
