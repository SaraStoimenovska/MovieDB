import { ExternalLink } from "lucide-react";
import { APP_LOCALE } from "@/shared/config/app";
import { Badge } from "@/shared/ui/badge";
import { formatCurrency, formatDate, formatLanguage } from "@/shared/utils/format";
import { type MediaDetails } from "../model/details";

type Fact = { readonly label: string; readonly value: string };

const list = (values: ReadonlyArray<string>, max = 4): string => values.slice(0, max).join(", ");

/** Pure: details → the facts worth showing (empty values dropped). */
const toFacts = (media: MediaDetails): ReadonlyArray<Fact> => {
  const date = (value: string | null) => formatDate(value, APP_LOCALE, { dateStyle: "long" });
  const next = media.nextEpisode;

  return [
    {
      label: media.mediaType === "movie" ? "Release date" : "First aired",
      value: date(media.releaseDate),
    },
    { label: "Last aired", value: date(media.lastAirDate) },
    {
      label: "Next episode",
      value: next
        ? `S${next.season} E${next.episode}${next.airDate ? ` · ${date(next.airDate)}` : ""}`
        : "",
    },
    { label: "Status", value: media.status ?? "" },
    { label: "Episodes", value: media.episodeCount ? String(media.episodeCount) : "" },
    { label: "Networks", value: list(media.networks) },
    { label: "Original language", value: formatLanguage(media.originalLanguage, APP_LOCALE) },
    { label: "Spoken languages", value: list(media.spokenLanguages) },
    { label: "Countries", value: list(media.countries) },
    { label: "Production", value: list(media.companies, 3) },
    { label: "Collection", value: media.collection ?? "" },
    { label: "Budget", value: formatCurrency(media.budget, APP_LOCALE) },
    { label: "Revenue", value: formatCurrency(media.revenue, APP_LOCALE) },
  ].filter((fact) => fact.value !== "");
};

export function MediaFacts({ media }: { readonly media: MediaDetails }) {
  const facts = toFacts(media);

  return (
    <section aria-labelledby="facts-heading" className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <h2 id="facts-heading" className="text-xl font-semibold tracking-tight">
          Details
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-sm text-muted-foreground">{fact.label}</dt>
              <dd className="font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-4 text-sm">
          {media.homepage && (
            <ExternalAnchor href={media.homepage}>Official website</ExternalAnchor>
          )}
          {media.imdbId && (
            <ExternalAnchor
              href={`https://www.imdb.com/title/${encodeURIComponent(media.imdbId)}/`}
            >
              IMDb
            </ExternalAnchor>
          )}
          <ExternalAnchor href={`https://www.themoviedb.org/${media.mediaType}/${media.id}`}>
            TMDB
          </ExternalAnchor>
        </div>
      </div>

      <div className="space-y-6">
        {media.crew.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Crew</h3>
            <dl className="space-y-2 text-sm">
              {media.crew.map((credit) => (
                <div key={credit.job} className="flex gap-2">
                  <dt className="w-40 shrink-0 text-muted-foreground">{credit.job}</dt>
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
                <li key={keyword}>
                  <Badge variant="outline" className="font-normal">
                    {keyword}
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

function ExternalAnchor({ href, children }: { readonly href: string; readonly children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
    >
      {children}
      <ExternalLink className="size-3.5" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
