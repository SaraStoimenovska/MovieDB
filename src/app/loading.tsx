import { PageSpinner } from "@/shared/ui/spinner";

/** Route-level fallback: shown while any page's server content is loading. */
export default function Loading() {
  return <PageSpinner label="Loading page" />;
}
