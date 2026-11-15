import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { toDomId } from "@/shared/utils/dom";

type Props = {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
};

/** Card-like settings group: heading + description on the left (desktop), controls on the right. */
export function PreferenceSection({ icon: Icon, title, description, children }: Props) {
  const headingId = toDomId("pref", title);
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-4 rounded-xl border p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-8"
    >
      <div className="space-y-1">
        <h2 id={headingId} className="flex items-center gap-2 font-semibold">
          <Icon className="size-4" aria-hidden />
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
