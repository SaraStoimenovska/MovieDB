import { User } from "lucide-react";
import Image from "next/image";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { type CastMember } from "../model/details";

export function CastList({ cast }: { readonly cast: ReadonlyArray<CastMember> }) {
  if (cast.length === 0) return null;

  return (
    <section aria-labelledby="cast-heading" className="space-y-3">
      <h2 id="cast-heading" className="text-xl font-semibold tracking-tight">
        Cast
      </h2>
      <ul className="flex snap-x gap-4 overflow-x-auto pb-4">
        {cast.map((member) => {
          const photo = tmdbImageUrl(member.profilePath, "w185");
          return (
            <li key={`${member.id}-${member.character}`} className="w-28 shrink-0 snap-start">
              <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted">
                {photo ? (
                  <Image
                    src={photo}
                    alt={member.name}
                    fill
                    sizes="112px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <User className="size-8" aria-hidden />
                  </div>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-tight font-medium">{member.name}</p>
              {member.character && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{member.character}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
