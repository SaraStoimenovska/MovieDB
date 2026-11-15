import { z } from "zod";
import { type MediaKey, MediaType, toMediaKey } from "@/shared/lib/tmdb/types";

/**
 * A shared list lives entirely in its link (there is no server to store it):
 *   /shared?name=Sara%27s+favorites&items=m550.t1399.m27205
 * `m` = movie, `t` = series, followed by the TMDB id, in list order. Only titles travel in the
 * link: never ratings, notes or dates.
 */
export type SharedList = {
  readonly name: string;
  readonly items: ReadonlyArray<{ readonly mediaType: MediaType; readonly id: number }>;
};

/** Keeps links short and the shared page's TMDB lookups bounded. */
export const MAX_SHARED_ITEMS = 50;
export const MAX_SHARED_NAME_LENGTH = 60;
export const DEFAULT_SHARED_NAME = "Shared list";

export const SharedParam = { Name: "name", Items: "items" } as const;

const TYPE_CODE: Readonly<Record<MediaType, string>> = {
  [MediaType.Movie]: "m",
  [MediaType.Tv]: "t",
};
const CODE_TYPE: Readonly<Record<string, MediaType>> = {
  m: MediaType.Movie,
  t: MediaType.Tv,
};
const ITEM_SEPARATOR = ".";
const ITEM_PATTERN = /^([mt])([1-9]\d{0,9})$/;

const itemFromKey = (key: MediaKey) => {
  const [mediaType, id] = key.split(":");
  return { mediaType: mediaType as MediaType, id: Number(id) };
};

/** Pure: list → query string (`name=…&items=…`). Duplicates and extras beyond the cap dropped. */
export const encodeSharedList = (name: string, keys: ReadonlyArray<MediaKey>): string => {
  const unique = keys.filter((key, index) => keys.indexOf(key) === index);
  const items = unique
    .slice(0, MAX_SHARED_ITEMS)
    .map(itemFromKey)
    .map((item) => `${TYPE_CODE[item.mediaType]}${item.id}`)
    .join(ITEM_SEPARATOR);
  return new URLSearchParams({
    [SharedParam.Name]: name.trim().slice(0, MAX_SHARED_NAME_LENGTH) || DEFAULT_SHARED_NAME,
    [SharedParam.Items]: items,
  }).toString();
};

const searchValueSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => (Array.isArray(value) ? value[0] : value) ?? "");

/**
 * Pure: page search params → list. Never throws: invalid items are skipped, the name is
 * trimmed and capped, an empty or missing list returns `null` (→ "invalid link" page).
 */
export const decodeSharedList = (
  params: Readonly<Record<string, string | ReadonlyArray<string> | undefined>>,
): SharedList | null => {
  const name = searchValueSchema.parse(params[SharedParam.Name]).trim();
  const raw = searchValueSchema.parse(params[SharedParam.Items]);
  const parsed = raw
    .split(ITEM_SEPARATOR)
    .map((token) => token.match(ITEM_PATTERN))
    .flatMap((match) => {
      const mediaType = match ? CODE_TYPE[match[1] ?? ""] : undefined;
      return match && mediaType ? [{ mediaType, id: Number(match[2]) }] : [];
    });
  const items = parsed
    .filter(
      (item, index) =>
        parsed.findIndex(
          (other) => toMediaKey(other.mediaType, other.id) === toMediaKey(item.mediaType, item.id),
        ) === index,
    )
    .slice(0, MAX_SHARED_ITEMS);
  if (items.length === 0) return null;
  return { name: name.slice(0, MAX_SHARED_NAME_LENGTH) || DEFAULT_SHARED_NAME, items };
};

/** "Sara's favorites" when a display name is set, otherwise just "Favorites". */
export const sharedListName = (displayName: string, listLabel: string): string =>
  displayName.trim() ? `${displayName.trim()}'s ${listLabel.toLowerCase()}` : listLabel;
