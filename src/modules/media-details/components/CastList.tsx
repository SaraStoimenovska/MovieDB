import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { type CastMember } from "../model/details";
import { SECTION_IDS } from "../model/presentation";

export function CastList({ cast }: { readonly cast: ReadonlyArray<CastMember> }) {
  if (cast.length === 0) return null;

  return (
    <section aria-labelledby={SECTION_IDS.cast} className="space-y-3">
      <h2 id={SECTION_IDS.cast} className="text-xl font-semibold tracking-tight">
        Cast
      </h2>
      <ul className="flex snap-x gap-3 overflow-x-auto pb-4 sm:gap-4">
        {cast.map((member) => {
          const photo = tmdbImageUrl(member.profilePath, "w185");
          return (
            <li
              key={`${member.id}-${member.character}`}
              className="w-24 shrink-0 snap-start sm:w-28"
            >
              <Link
                href={routes.person(member.id)}
                className="group block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={member.name}
                      fill
                      sizes="112px"
                      unoptimized
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <User className="size-8" aria-hidden />
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-tight font-medium group-hover:underline">
                  {member.name}
                </p>
                {member.character && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{member.character}</p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
