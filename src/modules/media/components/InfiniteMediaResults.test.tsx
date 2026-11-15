// @vitest-environment happy-dom
import { type InfiniteData, type UseInfiniteQueryResult } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type MediaSummary, type Paged } from "@/shared/lib/tmdb/types";
import { makeMedia } from "@/test/fixtures";
import { imageMock, linkMock } from "@/test/next-mocks";
import { renderWithProviders } from "@/test/render";
import { InfiniteMediaResults } from "./InfiniteMediaResults";

vi.mock("next/link", () => linkMock);
vi.mock("next/image", () => imageMock);

type Query = UseInfiniteQueryResult<InfiniteData<Paged<MediaSummary>>>;

const page = (ids: ReadonlyArray<number>): Paged<MediaSummary> => ({
  page: 1,
  totalPages: 2,
  totalResults: 40,
  results: ids.map((id) => makeMedia({ id, title: `Title ${id}` })),
});

const query = (overrides: Partial<Query>): Query =>
  ({
    data: undefined,
    status: "success",
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  }) as unknown as Query;

describe("InfiniteMediaResults", () => {
  it("shows a spinner while the first page loads", () => {
    renderWithProviders(
      <InfiniteMediaResults query={query({ status: "pending" })} emptyMessage="none" />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/loading titles/i);
  });

  it("shows an error with retry when nothing loaded", async () => {
    const refetch = vi.fn();
    const { user } = renderWithProviders(
      <InfiniteMediaResults query={query({ status: "error", refetch })} emptyMessage="none" />,
    );
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows the empty message", () => {
    const data = { pages: [page([])], pageParams: [1] };
    renderWithProviders(
      <InfiniteMediaResults query={query({ data })} emptyMessage="No titles here." />,
    );
    expect(screen.getByText("No titles here.")).toBeInTheDocument();
  });

  it("renders de-duplicated titles and the end of the list", () => {
    const data = { pages: [page([1, 2]), page([2, 3])], pageParams: [1, 2] };
    renderWithProviders(<InfiniteMediaResults query={query({ data })} emptyMessage="none" />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByText(/reached the end/i)).toBeInTheDocument();
  });

  it("keeps loaded titles and retries inline when a later page fails", async () => {
    const fetchNextPage = vi.fn();
    const data = { pages: [page([1, 2])], pageParams: [1] };
    const { user } = renderWithProviders(
      <InfiniteMediaResults
        query={query({
          data,
          status: "error",
          hasNextPage: true,
          isFetchNextPageError: true,
          fetchNextPage,
        })}
        emptyMessage="none"
      />,
    );
    expect(screen.getAllByRole("article")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: /couldn.t load more/i }));
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
