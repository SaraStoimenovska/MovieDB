// @vitest-environment happy-dom
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MediaType } from "@/shared/lib/tmdb/types";
import { makeMedia } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { EMPTY_LIBRARY, type LibraryEntry, toggleFavorite } from "../model/library";
import { LibraryCollection } from "./LibraryCollection";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const library = [
  makeMedia({ id: 1, title: "Alien" }),
  makeMedia({ id: 2, mediaType: MediaType.Tv, title: "Dark" }),
].reduce((data, media, index) => toggleFavorite(data, media, index + 1), EMPTY_LIBRARY);
const entries: ReadonlyArray<LibraryEntry> = Object.values(library.entries);
const favoritedAt = (entry: LibraryEntry) => entry.favoritedAt;

const renderCollection = () =>
  renderWithProviders(
    <LibraryCollection
      entries={entries}
      addedAt={favoritedAt}
      genreNames={{ 18: "Drama" }}
      listLabel="Favorites"
    />,
  );

beforeEach(() => {
  toast.mockClear();
  window.localStorage.clear();
});

describe("LibraryCollection", () => {
  it("shows the titles as a grid by default and switches to the list layout", async () => {
    const { user } = renderCollection();
    expect(screen.getByText("2 titles")).toBeInTheDocument();

    const grid = screen.getByRole("button", { name: "Grid view" });
    const list = screen.getByRole("button", { name: "List view" });
    expect(grid).toHaveAttribute("aria-pressed", "true");

    await user.click(list);
    expect(list).toHaveAttribute("aria-pressed", "true");
    // List rows show when each title was added.
    expect(screen.getAllByText(/^Added /)).toHaveLength(2);
  });

  it("shares the visible list as a link with the titles in the URL", async () => {
    // No system share sheet: the link is copied. (user-event provides the clipboard stub.)
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });

    const { user } = renderCollection();
    await user.click(screen.getByRole("button", { name: /share/i }));

    const url = new URL(await navigator.clipboard.readText());
    expect(url.pathname).toBe("/shared");
    expect(url.searchParams.get("name")).toBe("Favorites");
    // Recently favorited first: Dark (2) then Alien (1).
    expect(url.searchParams.get("items")).toBe("t2.m1");
    expect(toast).toHaveBeenCalledWith("Link copied", expect.anything());
  });
});
