// @vitest-environment happy-dom
import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { makeMedia } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { EMPTY_LIBRARY } from "../model/library";
import { useLibraryStore } from "../store/library-store";
import { DetailsRecommendations } from "./DetailsRecommendations";

const movie = makeMedia({ id: 550, title: "Fight Club" });
const items = [makeMedia({ id: 1, title: "Se7en" }), makeMedia({ id: 2, title: "Zodiac" })];

beforeEach(() => useLibraryStore.setState(EMPTY_LIBRARY));

describe("DetailsRecommendations", () => {
  it("says “You might also like” for titles that aren't favorites", () => {
    renderWithProviders(<DetailsRecommendations media={movie} items={items} />);
    expect(screen.getByRole("heading", { name: "You might also like" })).toBeInTheDocument();
  });

  it("says “Because you liked …” once the title is a favorite, and back when removed", () => {
    renderWithProviders(<DetailsRecommendations media={movie} items={items} />);

    act(() => useLibraryStore.getState().toggleFavorite(movie));
    expect(
      screen.getByRole("heading", { name: "Because you liked Fight Club" }),
    ).toBeInTheDocument();

    act(() => useLibraryStore.getState().toggleFavorite(movie));
    expect(screen.getByRole("heading", { name: "You might also like" })).toBeInTheDocument();
  });
});
