export const ELLIPSIS = "…";

/** Cuts `text` to at most `limit` characters (ellipsis included), never mid-whitespace. */
export const truncate = (text: string, limit: number): string =>
  text.length <= limit ? text : `${text.slice(0, Math.max(0, limit - 1)).trimEnd()}${ELLIPSIS}`;

/** "1 season" / "3 seasons": English plural for counts shown in the UI. */
export const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`;

/** Trims and collapses runs of blank lines; what user-written text is stored as. */
export const normalizeUserText = (text: string): string =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
