import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";

type Props = { readonly icon: LucideIcon; readonly title: string; readonly description: string };

export function LibraryEmptyState({ icon: Icon, title, description }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
      <Button asChild className="mt-2">
        <Link href={routes.browse()}>Browse titles</Link>
      </Button>
    </div>
  );
}
