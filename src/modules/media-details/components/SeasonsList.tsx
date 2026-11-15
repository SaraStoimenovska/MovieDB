import { MediaPoster } from "@/modules/media";
import { APP_LOCALE } from "@/shared/config/app";
import { formatYear } from "@/shared/utils/format";
import { type Season } from "../model/details";

export function SeasonsList({
  title,
  seasons,
}: {
  readonly title: string;
  readonly seasons: ReadonlyArray<Season>;
}) {
  if (seasons.length === 0) return null;

  return (
    <section aria-labelledby="seasons-heading" className="space-y-3">
      <h2 id="seasons-heading" className="text-xl font-semibold tracking-tight">
        Seasons{" "}
        <span className="text-base font-normal text-muted-foreground">({seasons.length})</span>
      </h2>
      <ul className="flex snap-x gap-4 overflow-x-auto pb-4">
        {seasons.map((season) => {
          const year = formatYear(season.airDate, APP_LOCALE);
          return (
            <li key={season.id} className="w-36 shrink-0 snap-start">
              <MediaPoster
                path={season.posterPath}
                title={`${title}, ${season.name}`}
                size="w185"
                sizes="144px"
              />
              <p className="mt-2 text-sm leading-tight font-medium">{season.name}</p>
              <p className="text-xs text-muted-foreground">
                {[year, `${season.episodeCount} episode${season.episodeCount === 1 ? "" : "s"}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
