import { type Metadata } from "next";
import { getPerson, PersonPage, popularPeopleParams } from "@/modules/people/server";
import { parseTmdbId } from "@/shared/lib/tmdb/ids";
import { truncate } from "@/shared/utils/text";

/** Search engines show ~155–160 characters of a description. */
const DESCRIPTION_LIMIT = 160;

export const generateStaticParams = popularPeopleParams;

export async function generateMetadata({ params }: PageProps<"/person/[id]">): Promise<Metadata> {
  const id = parseTmdbId((await params).id);
  const person = id === null ? null : await getPerson(id);
  if (!person) return { title: "Not found" };
  return {
    title: person.name,
    description: truncate(person.biography, DESCRIPTION_LIMIT) || undefined,
  };
}

export default function PersonRoute({ params }: PageProps<"/person/[id]">) {
  return <PersonPage params={params} />;
}
