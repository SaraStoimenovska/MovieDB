"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { useRegion } from "@/modules/preferences";
import { APP_REGION } from "@/shared/config/app";
import { routes } from "@/shared/config/routes";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { tmdbProxyGet } from "@/shared/lib/tmdb/browser";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { type MediaType } from "@/shared/lib/tmdb/types";
import { Spinner } from "@/shared/ui/spinner";
import { mapWatchProviders, type WatchProvider, type WatchProviders } from "../model/details";
import { SECTION_IDS } from "../model/presentation";

/** Rendered logo size (44px: readable, and a comfortable tap target). */
const PROVIDER_LOGO_PX = 44;

const GROUPS = [
  { key: "stream", label: "Stream" },
  { key: "free", label: "Free" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
] as const;

const providersResponseSchema = z.object({ results: z.record(z.string(), z.unknown()) });

type Props = {
  readonly mediaType: MediaType;
  readonly id: number;
  /** Server-rendered providers for the default region (no client fetch needed there). */
  readonly defaultProviders: WatchProviders | null;
};

/**
 * "Where to watch" for the user's region (Preferences). The default region is rendered on the
 * server; any other region is fetched through the cached proxy. JustWatch attribution required.
 */
export function WatchProvidersSection({ mediaType, id, defaultProviders }: Props) {
  const { region } = useRegion();
  const format = useFormatters();
  const isDefaultRegion = region === APP_REGION;

  const query = useQuery({
    queryKey: ["watch-providers", mediaType, id, region],
    queryFn: async ({ signal }) =>
      mapWatchProviders(
        providersResponseSchema.parse(
          await tmdbProxyGet(`${mediaType}/${id}/watch/providers`, {}, signal),
        ).results,
        region,
      ),
    enabled: !isDefaultRegion,
  });

  const providers = isDefaultRegion ? defaultProviders : (query.data ?? null);
  const loading = !isDefaultRegion && query.isPending;
  // Nothing to show in the default region: keep the page clean (other regions explain why).
  if (isDefaultRegion && !providers) return null;

  return (
    <section aria-labelledby={SECTION_IDS.providers} className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={SECTION_IDS.providers} className="text-xl font-semibold tracking-tight">
          Where to watch{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({format.region(region)})
          </span>
        </h2>
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://www.justwatch.com/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            JustWatch
          </a>
          {" · "}
          <Link href={routes.preferences()} className="underline underline-offset-4">
            Change region
          </Link>
        </p>
      </div>
      {loading ? (
        <Spinner label="Loading streaming options" />
      ) : providers ? (
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {GROUPS.filter((group) => providers[group.key].length > 0).map((group) => (
            <div key={group.key} className="space-y-2">
              <h3 className="text-sm text-muted-foreground">{group.label}</h3>
              <ul className="flex flex-wrap gap-2">
                {providers[group.key].map((provider) => (
                  <li key={provider.id}>
                    <ProviderLogo provider={provider} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {providers.link && (
            // TMDB/JustWatch only expose ONE page per title and region (no per-provider deep links),
            // so the logos are informational and this is the single, honest link.
            <a
              href={providers.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 self-end text-sm font-medium underline underline-offset-4"
            >
              See prices and links on TMDB
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {query.isError
            ? "Couldn't load streaming options."
            : `Not available to stream, rent or buy in ${format.region(region)} yet.`}
        </p>
      )}
    </section>
  );
}

function ProviderLogo({ provider }: { readonly provider: WatchProvider }) {
  const logo = tmdbImageUrl(provider.logoPath, "w92");
  const content = logo ? (
    <Image
      src={logo}
      alt={provider.name}
      width={PROVIDER_LOGO_PX}
      height={PROVIDER_LOGO_PX}
      unoptimized
      className="rounded-lg"
    />
  ) : (
    <span className="flex size-11 items-center justify-center rounded-lg bg-muted px-1 text-center text-[10px]">
      {provider.name}
    </span>
  );

  return (
    <span title={provider.name} className="block">
      {content}
    </span>
  );
}
