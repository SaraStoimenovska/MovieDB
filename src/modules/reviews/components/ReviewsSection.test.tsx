// @vitest-environment happy-dom
import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { EMPTY_COMMENTS } from "../model/comments";
import { EMPTY_REVIEWS } from "../model/reviews";
import { useCommentsStore, useReviewsStore } from "../store/reviews-store";
import { ReviewsSection } from "./ReviewsSection";

const toast = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const key = "movie:550" as const;

beforeEach(() => {
  useReviewsStore.setState(EMPTY_REVIEWS);
  useCommentsStore.setState(EMPTY_COMMENTS);
});

const writeReview = async (user: ReturnType<typeof renderWithProviders>["user"]) => {
  await user.click(screen.getByRole("button", { name: /write a review/i }));
  const form = screen.getByRole("form", { name: /post review/i });
  await user.type(within(form).getByLabelText("Your name"), "Sam");
  await user.click(within(form).getByLabelText("9 out of 10"));
  await user.type(within(form).getByLabelText(/^review$/i), "A sharp, darkly funny film.");
  await user.click(within(form).getByRole("button", { name: /post review/i }));
};

describe("ReviewsSection", () => {
  it("shows an empty state", () => {
    renderWithProviders(<ReviewsSection mediaKey={key} title="Fight Club" />);
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
  });

  it("validates the form before posting", async () => {
    const { user } = renderWithProviders(<ReviewsSection mediaKey={key} title="Fight Club" />);
    await user.click(screen.getByRole("button", { name: /write a review/i }));
    await user.click(screen.getByRole("button", { name: /post review/i }));

    expect(await screen.findByText("Please add your name.")).toBeInTheDocument();
    expect(screen.getByText("Pick a rating.")).toBeInTheDocument();
    expect(screen.getByText(/write at least 10 characters/i)).toBeInTheDocument();
    expect(useReviewsStore.getState().byMedia[key]).toBeUndefined();
  });

  it("posts, shows the average, and edits a review", async () => {
    const { user } = renderWithProviders(<ReviewsSection mediaKey={key} title="Fight Club" />);
    await writeReview(user);

    expect(screen.getByText("A sharp, darkly funny film.")).toBeInTheDocument();
    expect(screen.getByText(/average 9\.0\/10 from 1 review/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    const body = screen.getByLabelText(/^review$/i);
    await user.clear(body);
    await user.type(body, "Even better on a rewatch.");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText("Even better on a rewatch.")).toBeInTheDocument();
    expect(screen.getByText(/edited/)).toBeInTheDocument();
  });

  it("renders user text as text, never as HTML", async () => {
    const { user } = renderWithProviders(<ReviewsSection mediaKey={key} title="Fight Club" />);
    await user.click(screen.getByRole("button", { name: /write a review/i }));
    const form = screen.getByRole("form", { name: /post review/i });
    await user.type(within(form).getByLabelText("Your name"), "<b>x</b>");
    await user.click(within(form).getByLabelText("5 out of 10"));
    await user.type(within(form).getByLabelText(/^review$/i), "<img src=x onerror=alert(1)>");
    await user.click(within(form).getByRole("button", { name: /post review/i }));

    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(document.querySelector("img[src='x']")).toBeNull();
  });

  it("comments, replies, and deletes the review with its comments after confirming", async () => {
    const { user } = renderWithProviders(<ReviewsSection mediaKey={key} title="Fight Club" />);
    await writeReview(user);

    // Open the thread (the toggle is the only "Comment" button with aria-expanded).
    await user.click(screen.getByRole("button", { name: /^comment$/i, expanded: false }));
    const commentForm = screen.getByRole("form", { name: "Comment" });
    await user.type(within(commentForm).getByLabelText("Add a comment…"), "Agreed!");
    await user.click(within(commentForm).getByRole("button", { name: "Comment" }));
    expect(await screen.findByText("Agreed!")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^reply$/i }));
    const replyForm = screen.getByRole("form", { name: "Reply" });
    await user.type(within(replyForm).getByLabelText(/reply to sam/i), "Me too");
    await user.click(within(replyForm).getByRole("button", { name: "Reply" }));
    expect(await screen.findByText("Me too")).toBeInTheDocument();

    const reviewId = useReviewsStore.getState().byMedia[key]![0]!.id;
    expect(useCommentsStore.getState().byReview[reviewId]).toHaveLength(2);

    // The review's own Delete comes first (comments' Delete buttons follow in the thread).
    await user.click(screen.getAllByRole("button", { name: /^delete$/i })[0]!);
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/all of its comments/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(useCommentsStore.getState().byReview[reviewId]).toBeUndefined();
  });
});
