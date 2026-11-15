// @vitest-environment happy-dom
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { rawMovie, rawPage, rawTv } from "@/test/fixtures";
import { server } from "@/test/msw/server";
import {
  imageMock,
  navigationMock,
  navigationState,
  resetNavigation,
  router,
} from "@/test/next-mocks";
import { renderWithProviders } from "@/test/render";
import { HeaderSearch } from "./HeaderSearch";

vi.mock("next/navigation", () => navigationMock);
vi.mock("next/image", () => imageMock);

const searchHandler = vi.fn();

beforeEach(() => {
  resetNavigation();
  searchHandler.mockReset();
  // cmdk scrolls the active item into view; happy-dom doesn't implement it.
  Element.prototype.scrollIntoView = vi.fn();
  server.use(
    http.get("http://localhost:3000/api/tmdb/search/multi", ({ request }) => {
      searchHandler(new URL(request.url).searchParams.get("query"));
      return HttpResponse.json(
        rawPage([
          { ...rawMovie(), media_type: "movie" },
          { id: 287, name: "Brad Pitt", media_type: "person" },
          { ...rawTv(), media_type: "tv" },
        ]),
      );
    }),
  );
});

describe("HeaderSearch", () => {
  it("shows debounced suggestions (movies and series, not people)", async () => {
    const { user } = renderWithProviders(<HeaderSearch />);
    await user.type(screen.getByRole("combobox"), "fight");

    expect(await screen.findByText("Fight Club")).toBeInTheDocument();
    expect(screen.getByText("Game of Thrones")).toBeInTheDocument();
    expect(screen.queryByText("Brad Pitt")).not.toBeInTheDocument();
    expect(searchHandler).toHaveBeenLastCalledWith("fight");
  });

  it("does not search below the minimum length", async () => {
    const { user } = renderWithProviders(<HeaderSearch />);
    await user.type(screen.getByRole("combobox"), "f");
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(searchHandler).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Enter on the first row opens the full results page", async () => {
    const { user } = renderWithProviders(<HeaderSearch />);
    await user.type(screen.getByRole("combobox"), "fight");
    await screen.findByText("Fight Club");
    await user.keyboard("{Enter}");
    expect(router.push).toHaveBeenCalledWith("/search?q=fight");
  });

  it("choosing a suggestion opens its details page", async () => {
    const { user } = renderWithProviders(<HeaderSearch />);
    await user.type(screen.getByRole("combobox"), "fight");
    await user.click(await screen.findByText("Game of Thrones"));
    expect(router.push).toHaveBeenCalledWith("/tv/1399");
  });

  it("on the results page, typing updates the URL instead of showing suggestions", async () => {
    Object.assign(navigationState, { pathname: "/search", search: "q=dune" });
    const { user } = renderWithProviders(<HeaderSearch />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("dune");

    await user.clear(input);
    await user.type(input, "alien");
    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenLastCalledWith("/search?q=alien", { scroll: false }),
    );
    expect(searchHandler).not.toHaveBeenCalled();
  });
});
