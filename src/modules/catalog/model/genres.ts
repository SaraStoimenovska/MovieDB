import { z } from "zod";

export type Genre = { readonly id: number; readonly name: string };

export const tmdbGenreListSchema = z.object({
  genres: z.array(z.object({ id: z.number().int(), name: z.string() })),
});

export const parseGenreList = (raw: unknown): ReadonlyArray<Genre> =>
  tmdbGenreListSchema.parse(raw).genres.toSorted((a, b) => a.name.localeCompare(b.name));
