"use client";

import { useReviewsCrossTabSync } from "../hooks/useReviews";

/** Mount once (in the app providers) to keep reviews and comments in sync across tabs. */
export function ReviewsSync() {
  useReviewsCrossTabSync();
  return null;
}
