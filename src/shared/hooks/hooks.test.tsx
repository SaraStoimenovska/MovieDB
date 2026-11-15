// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useFormatters } from "@/shared/hooks/useFormatters";
import { useHydrated } from "@/shared/hooks/useHydrated";

describe("useFormatters", () => {
  it("binds the app locale by default", () => {
    const { result } = renderHook(() => useFormatters());
    expect(result.current.runtime(125)).toBe("2h 5m");
    expect(result.current.rating(7.456)).toBe("7.5");
    expect(result.current.date("2026-11-14")).toBe("Nov 14, 2026");
  });

  it("accepts an explicit locale", () => {
    const { result } = renderHook(() => useFormatters("de-DE"));
    expect(result.current.rating(7.456)).toBe("7,5");
  });

  it("returns a stable object between renders", () => {
    const { result, rerender } = renderHook(() => useFormatters());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("only emits the latest value after the delay", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    rerender({ value: "abc" });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("abc");
  });
});

describe("useHydrated", () => {
  it("is true after mounting on the client", () => {
    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(true);
  });
});
