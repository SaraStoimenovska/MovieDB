// @vitest-environment happy-dom
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DEFAULT_FILTERS, SortKey } from "../model/filters";
import { CatalogFilters } from "./CatalogFilters";

const genres = [{ id: 18, name: "Drama" }];

describe("CatalogFilters", () => {
  it("hides Reset while all filters are default", () => {
    renderWithProviders(
      <CatalogFilters
        filters={DEFAULT_FILTERS}
        genres={genres}
        keywordName={null}
        maxYear={2027}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
  });

  it("resets every filter", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <CatalogFilters
        filters={{ sort: SortKey.TopRated, genreId: 18, year: 2000, keywordId: null }}
        genres={genres}
        keywordName={null}
        maxYear={2027}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(onChange).toHaveBeenCalledWith(DEFAULT_FILTERS);
  });

  it("shows the keyword chip and removes only the keyword", async () => {
    const onChange = vi.fn();
    const filters = { ...DEFAULT_FILTERS, keywordId: 9715 };
    const { user } = renderWithProviders(
      <CatalogFilters
        filters={filters}
        genres={genres}
        keywordName="superhero"
        maxYear={2027}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("superhero")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /remove keyword filter superhero/i }));
    expect(onChange).toHaveBeenCalledWith({ ...filters, keywordId: null });
  });

  it("labels each select for screen readers", () => {
    renderWithProviders(
      <CatalogFilters
        filters={DEFAULT_FILTERS}
        genres={genres}
        keywordName={null}
        maxYear={2027}
        onChange={vi.fn()}
      />,
    );
    ["Sort by", "Genre", "Year"].forEach((name) =>
      expect(screen.getByRole("combobox", { name })).toBeInTheDocument(),
    );
  });
});
