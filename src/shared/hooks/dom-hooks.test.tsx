// @vitest-environment happy-dom
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHotkey } from "@/shared/hooks/useHotkey";
import { useInView } from "@/shared/hooks/useInView";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { useRehydrateOnStorage } from "@/shared/hooks/useRehydrateOnStorage";

type ObserverCallback = (entries: ReadonlyArray<{ isIntersecting: boolean }>) => void;

const observers: Array<{ callback: ObserverCallback; disconnect: ReturnType<typeof vi.fn> }> = [];

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(function (this: unknown, callback: ObserverCallback) {
      const observer = { callback, observe: vi.fn(), disconnect: vi.fn() };
      observers.push(observer);
      return observer;
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

function Sentinel({ disabled, onChange }: { disabled: boolean; onChange: (v: boolean) => void }) {
  const { ref, inView } = useInView({ disabled });
  onChange(inView);
  return <div ref={ref} />;
}

describe("useInView", () => {
  it("reports visibility from the observer", () => {
    const seen: boolean[] = [];
    render(<Sentinel disabled={false} onChange={(v) => seen.push(v)} />);
    act(() => observers[0]!.callback([{ isIntersecting: true }]));
    expect(seen.at(-1)).toBe(true);
  });

  it("forgets a stale 'visible' when observation stops (no chain-loading on re-enable)", () => {
    const seen: boolean[] = [];
    const { rerender } = render(<Sentinel disabled={false} onChange={(v) => seen.push(v)} />);
    act(() => observers[0]!.callback([{ isIntersecting: true }]));
    rerender(<Sentinel disabled onChange={(v) => seen.push(v)} />);
    expect(observers[0]!.disconnect).toHaveBeenCalled();
    rerender(<Sentinel disabled={false} onChange={(v) => seen.push(v)} />);
    // Re-enabled: must not report true until the new observer measures the element.
    expect(seen.at(-1)).toBe(false);
  });
});

describe("useHotkey", () => {
  it("fires on the key, but not while typing in a field or with modifiers", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("/", handler));
    const input = document.body.appendChild(document.createElement("input"));

    fireEvent.keyDown(window, { key: "/" });
    fireEvent.keyDown(input, { key: "/" });
    fireEvent.keyDown(window, { key: "/", ctrlKey: true });
    fireEvent.keyDown(window, { key: "a" });

    expect(handler).toHaveBeenCalledTimes(1);
    input.remove();
  });
});

describe("useReducedMotion", () => {
  it("reflects the media query", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduce"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});

describe("useRehydrateOnStorage", () => {
  it("rehydrates only for its own key", () => {
    const rehydrate = vi.fn();
    renderHook(() => useRehydrateOnStorage("mdb:test", rehydrate));
    window.dispatchEvent(new StorageEvent("storage", { key: "mdb:other" }));
    window.dispatchEvent(new StorageEvent("storage", { key: "mdb:test" }));
    expect(rehydrate).toHaveBeenCalledTimes(1);
  });
});
