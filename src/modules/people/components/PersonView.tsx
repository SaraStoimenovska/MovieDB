import "server-only";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { MediaCarousel, MediaPoster } from "@/modules/media";
import { ExpandableText } from "@/shared/components/ExpandableText";
import { APP_LOCALE } from "@/shared/config/app";
import { formatDate } from "@/shared/utils/format";
import { getPerson } from "../api/server";
import { defaultCreditTab, type PersonDetails } from "../model/person";
import { AgeLabel } from "./AgeLabel";
import { Filmography } from "./Filmography";

const BIO_PREVIEW_CHARS = 600;

type Fact = { readonly label: string; readonly value: ReactNode };

const lifeFacts = (person: PersonDetails): ReadonlyArray<Fact> => {
  const date = (value: string) => formatDate(value, APP_LOCALE, { dateStyle: "long" });
  const facts: ReadonlyArray<Fact | null> = [
    person.knownForDepartment ? { label: "Known for", value: person.knownForDepartment } : null,
    person.birthday
      ? {
          label: "Born",
          value: (
            <>
              {date(person.birthday)}
              {!person.deathday && <AgeLabel birthday={person.birthday} deathday={null} />}
            </>
          ),
        }
      : null,
    person.deathday
      ? {
          label: "Died",
          value: (
            <>
              {date(person.deathday)}
              {person.birthday && (
                <AgeLabel birthday={person.birthday} deathday={person.deathday} />
              )}
            </>
          ),
        }
      : null,
    person.placeOfBirth ? { label: "Place of birth", value: person.placeOfBirth } : null,
  ];
  return facts.filter((fact): fact is Fact => fact !== null);
};

export async function PersonView({ id }: { readonly id: number }) {
  const person = await getPerson(id);
  if (!person) notFound();

  return (
    <div className="space-y-12">
      <section className="grid gap-6 sm:grid-cols-[200px_1fr] md:grid-cols-[240px_1fr]">
        <MediaPoster
          path={person.profilePath}
          title={person.name}
          size="w500"
          sizes="(min-width: 768px) 240px, (min-width: 640px) 200px, 50vw"
          priority
          className="mx-auto w-44 shadow-lg sm:w-full"
        />
        <div className="min-w-0 space-y-4">
          <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl md:text-4xl">
            {person.name}
          </h1>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {lifeFacts(person).map((fact) => (
              <div key={fact.label}>
                <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                <dd className="font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Biography</h2>
            {person.biography ? (
              <ExpandableText
                text={person.biography}
                previewChars={BIO_PREVIEW_CHARS}
                className="max-w-prose"
              />
            ) : (
              <p className="text-muted-foreground">No biography available.</p>
            )}
          </div>
          {person.imdbId && (
            <a
              href={`https://www.imdb.com/name/${encodeURIComponent(person.imdbId)}/`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
            >
              IMDb <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      </section>

      <MediaCarousel title="Known for" items={person.knownFor} showType />

      <Filmography
        acting={person.acting}
        crew={person.crew}
        defaultTab={defaultCreditTab(person)}
      />
    </div>
  );
}
