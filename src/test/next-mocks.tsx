import { type AnchorHTMLAttributes, type ImgHTMLAttributes } from "react";
import { vi } from "vitest";

/**
 * Next.js mocks for component tests (use with `vi.mock("next/navigation", () => navigationMock)`
 * etc.). Router calls are recorded on `router` so tests can assert navigation.
 */
export const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() };

export const navigationState = { pathname: "/", search: "" };

export const navigationMock = {
  useRouter: () => router,
  usePathname: () => navigationState.pathname,
  useSearchParams: () => new URLSearchParams(navigationState.search),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
};

export const linkMock = {
  default: ({
    href,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
};

export const imageMock = {
  default: ({
    fill: _fill,
    priority: _priority,
    unoptimized: _u,
    alt,
    ...rest
  }: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    unoptimized?: boolean;
  }) => (
    // Test stand-in for next/image: a plain <img> is exactly what we want here.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...rest} />
  ),
};

export const resetNavigation = () => {
  Object.assign(navigationState, { pathname: "/", search: "" });
  Object.values(router).forEach((fn) => fn.mockReset());
};
