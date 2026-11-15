import Image from "next/image";
import { APP_REGION } from "@/shared/config/app";
import { tmdbImageUrl } from "@/shared/lib/tmdb/image";
import { type WatchProvider, type WatchProviders } from "../model/details";

const GROUPS = [
  { key: "stream", label: "Stream" },
  { key: "free", label: "Free" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
] as const;

/** "Where to watch" (TMDB data powered by JustWatch, whose attribution is required). */
export function WatchProvidersSection({
  providers,
}: {
  readonly providers: WatchProviders | null;
}) {
  if (!providers) return null;

  return (
    <section aria-labelledby="providers-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="providers-heading" className="text-xl font-semibold tracking-tight">
          Where to watch{" "}
          <span className="text-sm font-normal text-muted-foreground">({APP_REGION})</span>
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
        </p>
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        {GROUPS.filter((group) => providers[group.key].length > 0).map((group) => (
          <div key={group.key} className="space-y-2">
            <h3 className="text-sm text-muted-foreground">{group.label}</h3>
            <ul className="flex flex-wrap gap-2">
              {providers[group.key].map((provider) => (
                <li key={provider.id}>
                  <ProviderLogo provider={provider} href={providers.link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProviderLogo({
  provider,
  href,
}: {
  readonly provider: WatchProvider;
  readonly href: string | null;
}) {
  const logo = tmdbImageUrl(provider.logoPath, "w92");
  const content = logo ? (
    <Image
      src={logo}
      alt={provider.name}
      width={44}
      height={44}
      unoptimized
      className="rounded-lg"
    />
  ) : (
    <span className="flex size-11 items-center justify-center rounded-lg bg-muted px-1 text-center text-[10px]">
      {provider.name}
    </span>
  );

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={provider.name}
      className="block transition-transform hover:scale-105"
    >
      {content}
    </a>
  ) : (
    <span title={provider.name}>{content}</span>
  );
}
