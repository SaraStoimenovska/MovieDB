import { describe, expect, it } from "vitest";
import { deepFreeze } from "@/test/fixtures";
import {
  addComment,
  buildThread,
  commentInputSchema,
  commentsDataSchema,
  countLiveComments,
  deleteComment,
  editComment,
  EMPTY_COMMENTS,
  removeReviewComments,
  selectComments,
} from "./comments";
import {
  addReview,
  averageRating,
  deleteReview,
  EMPTY_REVIEWS,
  emptyFormValues,
  REVIEW_LIMITS,
  reviewInputSchema,
  reviewsDataSchema,
  selectReviews,
  sortNewestFirst,
  toFormValues,
  updateReview,
} from "./reviews";

const key = "movie:550" as const;
const input = { author: "Sam", rating: 8, title: "Great", body: "Really enjoyed it." };

describe("reviewInputSchema", () => {
  it("trims and normalizes valid input", () => {
    expect(
      reviewInputSchema.parse({
        ...input,
        author: "  Sam ",
        body: "  Really\n\n\n\nenjoyed it.  ",
      }),
    ).toEqual({
      ...input,
      body: "Really\n\nenjoyed it.",
    });
  });

  it("coerces the rating from a form string", () => {
    expect(reviewInputSchema.parse({ ...input, rating: "7" }).rating).toBe(7);
  });

  it.each([
    [{ author: "   " }, "author"],
    [{ rating: 0 }, "rating"],
    [{ rating: 11 }, "rating"],
    [{ body: "short" }, "body"],
    [{ body: "x".repeat(REVIEW_LIMITS.bodyMax + 1) }, "body"],
    [{ title: "x".repeat(REVIEW_LIMITS.titleMax + 1) }, "title"],
  ])("rejects %j", (patch, field) => {
    const result = reviewInputSchema.safeParse({ ...input, ...patch });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe(field);
  });

  it("allows an empty title", () => {
    expect(reviewInputSchema.safeParse({ ...input, title: "  " }).success).toBe(true);
  });
});

describe("review reducers", () => {
  const empty = deepFreeze(EMPTY_REVIEWS);
  const one = deepFreeze(addReview(empty, key, input, "r1", 1));

  it("adds with id and timestamps", () => {
    expect(selectReviews(one, key)).toEqual([
      { id: "r1", mediaKey: key, ...input, createdAt: 1, updatedAt: 1 },
    ]);
  });

  it("updates only the targeted review", () => {
    const two = deepFreeze(addReview(one, key, { ...input, rating: 4 }, "r2", 2));
    const updated = updateReview(two, key, "r1", { ...input, rating: 10 }, 5);
    expect(selectReviews(updated, key).map((r) => [r.id, r.rating, r.updatedAt])).toEqual([
      ["r1", 10, 5],
      ["r2", 4, 2],
    ]);
  });

  it("deletes, dropping the media key when empty", () => {
    expect(deleteReview(one, key, "r1")).toEqual(EMPTY_REVIEWS);
  });

  it("returns a stable empty list for unknown media", () => {
    expect(selectReviews(empty, "tv:1")).toBe(selectReviews(empty, "tv:2"));
  });

  it("sorts newest first and averages", () => {
    const reviews = [
      { ...input, id: "a", mediaKey: key, rating: 7, createdAt: 1, updatedAt: 1 },
      { ...input, id: "b", mediaKey: key, rating: 8, createdAt: 3, updatedAt: 3 },
    ];
    expect(sortNewestFirst(reviews).map((r) => r.id)).toEqual(["b", "a"]);
    expect(averageRating(reviews)).toBe(7.5);
    expect(averageRating([])).toBeNull();
  });

  it("maps to and from form values", () => {
    const review = selectReviews(one, key)[0]!;
    expect(toFormValues(review)).toEqual(input);
    expect(emptyFormValues("Sam")).toEqual({ author: "Sam", rating: 0, title: "", body: "" });
  });

  it("validates persisted reviews", () => {
    expect(reviewsDataSchema.safeParse(one).success).toBe(true);
    expect(reviewsDataSchema.safeParse({ byMedia: { [key]: [{ id: "x" }] } }).success).toBe(false);
  });
});

describe("comments", () => {
  const empty = deepFreeze(EMPTY_COMMENTS);
  const c = (body: string) => ({ author: "Ann", body });
  const thread = deepFreeze(
    [
      (d: typeof empty) => addComment(d, "r1", null, c("root"), "c1", 1),
      (d: typeof empty) => addComment(d, "r1", "c1", c("reply"), "c2", 2),
      (d: typeof empty) => addComment(d, "r1", "c2", c("nested"), "c3", 3),
      (d: typeof empty) => addComment(d, "r1", null, c("second root"), "c4", 4),
    ].reduce((acc, step) => step(acc), empty),
  );

  it("builds a reply tree, oldest first", () => {
    const tree = buildThread(selectComments(thread, "r1"));
    expect(tree.map((n) => n.comment.id)).toEqual(["c1", "c4"]);
    expect(tree[0]?.replies[0]?.comment.id).toBe("c2");
    expect(tree[0]?.replies[0]?.replies[0]).toMatchObject({ depth: 2, comment: { id: "c3" } });
  });

  it("shows orphans (missing parent) at the top level", () => {
    const orphan = addComment(empty, "r1", "missing", c("orphan"), "o1", 1);
    expect(buildThread(selectComments(orphan, "r1")).map((n) => n.comment.id)).toEqual(["o1"]);
  });

  it("edits live comments only", () => {
    const edited = editComment(thread, "r1", "c1", "changed", 9);
    expect(selectComments(edited, "r1")[0]).toMatchObject({ body: "changed", updatedAt: 9 });
  });

  it("soft-deletes a comment with replies, keeping the replies", () => {
    const after = deleteComment(thread, "r1", "c1", 9);
    const root = selectComments(after, "r1").find((comment) => comment.id === "c1");
    expect(root).toMatchObject({ deleted: true, body: "" });
    expect(countLiveComments(selectComments(after, "r1"))).toBe(3);
  });

  it("removes a leaf, and prunes deleted parents left without replies", () => {
    const softDeleted = deepFreeze(deleteComment(thread, "r1", "c2", 5));
    const leafGone = deleteComment(softDeleted, "r1", "c3", 6);
    expect(selectComments(leafGone, "r1").map((comment) => comment.id)).toEqual(["c1", "c4"]);
  });

  it("removes a review's whole thread", () => {
    expect(removeReviewComments(thread, "r1")).toEqual(EMPTY_COMMENTS);
  });

  it("validates input and persisted data", () => {
    expect(commentInputSchema.safeParse(c("   ")).success).toBe(false);
    expect(commentInputSchema.parse(c("  hi  ")).body).toBe("hi");
    expect(commentsDataSchema.safeParse(thread).success).toBe(true);
  });
});
