// @vitest-environment happy-dom
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw/server";
import { imageMock, linkMock } from "@/test/next-mocks";
import { renderWithProviders } from "@/test/render";
import { EMPTY_EPISODES } from "../model/episodes";
import { useEpisodesStore } from "../store/episodes-store";
import { EpisodeTracker } from "./EpisodeTracker";
import { UpNextRow } from "./UpNextRow";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("next/image", () => imageMock);
vi.mock("next/link", () => linkMock);

const show = { key: "tv:1399" as const, id: 1399, title: "Game of Thrones", posterPath: null };
const seasons = [
  { number: 1, name: "Season 1", episodeCount: 3, airDate: "2011-04-17", posterPath: null },
];

beforeEach(() => {
  useEpisodesStore.setState(EMPTY_EPISODES);
  server.use(
    http.get("http://localhost:3000/api/tmdb/tv/1399/season/1", () =>
      HttpResponse.json({
        episodes: [
          { episode_number: 1, name: "Winter Is Coming", air_date: "2011-04-17", runtime: 62 },
          { episode_number: 2, name: "The Kingsroad", air_date: "2011-04-24", runtime: 56 },
          { episode_number: 3, name: "From the future", air_date: "2999-01-01", runtime: 50 },
        ],
      }),
    ),
  );
});

describe("EpisodeTracker", () => {
  it("lists episodes when a season is expanded and tracks progress", async () => {
    const { user } = renderWithProviders(<EpisodeTracker show={show} seasons={seasons} />);
    await user.click(screen.getByRole("button", { name: /season 1/i, expanded: false }));

    const first = await screen.findByRole("checkbox", { name: /winter is coming/i });
    await user.click(first);

    expect(first).toBeChecked();
    expect(screen.getByText(/1\/3 episodes watched/i)).toBeInTheDocument();
    expect(screen.getByText("S1 E2")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
  });

  it("does not allow marking unaired episodes", async () => {
    const { user } = renderWithProviders(<EpisodeTracker show={show} seasons={seasons} />);
    await user.click(screen.getByRole("button", { name: /season 1/i, expanded: false }));
    expect(await screen.findByRole("checkbox", { name: /from the future/i })).toBeDisabled();
  });

  it("'Mark watched' marks every aired episode of the season", async () => {
    const { user } = renderWithProviders(<EpisodeTracker show={show} seasons={seasons} />);
    await user.click(screen.getByRole("button", { name: /mark season 1 as watched/i }));
    await vi.waitFor(() =>
      expect(Object.keys(useEpisodesStore.getState().shows[show.key]?.watched ?? {})).toEqual([
        "1:1",
        "1:2",
      ]),
    );
  });
});

describe("UpNextRow", () => {
  it("is hidden until a show is started, then shows the next episode", () => {
    const { rerender } = renderWithProviders(<UpNextRow />);
    expect(screen.queryByText("Up next")).not.toBeInTheDocument();

    useEpisodesStore.getState().toggle(show, seasons, { season: 1, episode: 1 }, 62);
    rerender(<UpNextRow />);
    expect(screen.getByText("Up next")).toBeInTheDocument();
    expect(screen.getByText("Next: S1 E2")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/tv/1399#seasons");
  });
});
