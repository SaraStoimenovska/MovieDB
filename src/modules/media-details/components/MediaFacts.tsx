import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { APP_LOCALE } from "@/shared/config/app";
import { routes } from "@/shared/config/routes";
import { Badge } from "@/shared/ui/badge";
import { type MediaDetails } from "../model/details";
import { externalLinks, SECTION_IDS, toFacts } from "../model/presentation";

export function MediaFacts({ media }: { readonly media: MediaDetails }) {
  const facts = toFacts(media, APP_LOCALE);

  return (
    <section aria-labelledby={SECTION_IDS.facts} className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <h2 id={SECTION_IDS.facts} className="text-xl font-semibold tracking-tight">
          Details
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="text-sm text-muted-foreground">{fact.label}</dt>
              <dd className="font-medium break-words">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {externalLinks(media).map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
              >
                {link.label}
                <ExternalLink className="size-3.5" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 space-y-6">
        {media.crew.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Crew</h3>
            {/* Stacked on phones, label column from sm up. */}
            <dl className="space-y-3 text-sm sm:space-y-2">
              {media.crew.map((credit) => (
                <div key={credit.job} className="sm:flex sm:gap-2">
                  <dt className="text-muted-foreground sm:w-40 sm:shrink-0">{credit.job}</dt>
                  <dd className="font-medium">{credit.names.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {media.keywords.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Keywords</h3>
            <ul className="flex flex-wrap gap-1.5">
              {media.keywords.map((keyword) => (
                <li key={keyword.id}>
                  <Badge asChild variant="outline" className="font-normal hover:bg-accent">
                    <Link
                      href={routes.browse({ mediaType: media.mediaType, keywordId: keyword.id })}
                      title={`Browse titles tagged “${keyword.name}”`}
                    >
                      {keyword.name}
                    </Link>
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
