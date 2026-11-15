// @vitest-environment happy-dom
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MediaType } from "@/shared/lib/tmdb/types";
import { makeMedia } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { EMPTY_LIBRARY, LIBRARY_STORAGE_KEY, toMediaSnapshot, WatchStatus } from "../model/library";
import { useLibraryStore } from "../store/library-store";
import { FavoriteButton } from "./FavoriteButton";
import { LibraryActions } from "./LibraryActions";
import { WatchStatusMenu } from "./WatchStatusMenu";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const movie = makeMedia();
const stored = () => JSON.parse(window.localStorage.getItem(LIBRARY_STORAGE_KEY) ?? "null");

beforeEach(() => {
  useLibraryStore.setState(EMPTY_LIBRARY);
  toast.mockClear();
});

describe("FavoriteButton", () => {
  it("toggles the favorite, persists it, and offers undo", async () => {
    const { user } = renderWithProviders(<FavoriteButton media={movie} />);
    const button = screen.getByRole("button", { name: /add to favorites/i });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(stored().state.entries[movie.key].isFavorite).toBe(true);
    expect(toast).toHaveBeenCalledWith(
      "Added to favorites",
      expect.objectContaining({ description: movie.title }),
    );

    // Undo from the toast restores the previous state.
    const undo = toast.mock.calls[0]![1].action.onClick as () => void;
    undo();
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "false"));
  });

  it("icon variant keeps a constant accessible name (state is in aria-pressed)", async () => {
    const { user } = renderWithProviders(<FavoriteButton media={movie} variant="icon" />);
    const button = screen.getByRole("button", { name: `Favorite: ${movie.title}` });
    await user.click(button);
    expect(screen.getByRole("button", { name: `Favorite: ${movie.title}` })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("WatchStatusMenu", () => {
  it("sets a status from the menu and removes it again", async () => {
    const { user } = renderWithProviders(<WatchStatusMenu media={movie} />);
    await user.click(screen.getByRole("button", { name: /add to list/i }));
    await user.click(await screen.findByRole("menuitem", { name: /want to watch/i }));

    expect(useLibraryStore.getState().entries[movie.key]?.status).toBe(WatchStatus.ToWatch);
    expect(screen.getByRole("button", { name: /want to watch/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /want to watch/i }));
    await user.click(await screen.findByRole("menuitem", { name: /remove from list/i }));
    expect(useLibraryStore.getState().entries[movie.key]).toBeUndefined();
  });
});

describe("LibraryActions (details page)", () => {
  it("rating a title marks it as watched and stores the runtime", async () => {
    const { user } = renderWithProviders(
      <LibraryActions media={movie} extras={{ runtimeMinutes: 139 }} />,
    );
    await user.click(screen.getByLabelText("8 out of 10"));

    expect(useLibraryStore.getState().entries[movie.key]).toMatchObject({
      rating: 8,
      status: WatchStatus.Watched,
      runtimeMinutes: 139,
    });
    expect(screen.getByRole("button", { name: /watched/i })).toBeInTheDocument();
  });
});

describe("library store persistence", () => {
  it("ignores corrupt localStorage on rehydrate", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    window.localStorage.setItem(LIBRARY_STORAGE_KEY, "{broken");
    await useLibraryStore.persist.rehydrate();
    expect(useLibraryStore.getState().entries).toEqual({});
  });

  it("ignores well-formed JSON with the wrong shape", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    window.localStorage.setItem(
      LIBRARY_STORAGE_KEY,
      JSON.stringify({ state: { entries: { "movie:1": { hacked: true } } }, version: 2 }),
    );
    await useLibraryStore.persist.rehydrate();
    expect(useLibraryStore.getState().entries).toEqual({});
  });

  it("migrates data saved by version 1 of the app", async () => {
    const series = makeMedia({ id: 1399, mediaType: MediaType.Tv });
    const v1Entry = {
      media: toMediaSnapshot(series),
      isFavorite: true,
      status: null,
      favoritedAt: 1,
      statusAt: null,
      updatedAt: 1,
    };
    window.localStorage.setItem(
      LIBRARY_STORAGE_KEY,
      JSON.stringify({ state: { entries: { [series.key]: v1Entry } }, version: 1 }),
    );
    await useLibraryStore.persist.rehydrate();
    expect(useLibraryStore.getState().entries[series.key]).toMatchObject({
      isFavorite: true,
      rating: null,
    });
  });
});
