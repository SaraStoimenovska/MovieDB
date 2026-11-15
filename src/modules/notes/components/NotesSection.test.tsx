// @vitest-environment happy-dom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEBOUNCE_MS } from "@/shared/config/timing";
import { EMPTY_NOTES } from "../model/notes";
import { useNotesStore } from "../store/notes-store";
import { NotesSection } from "./NotesSection";

const key = "movie:550" as const;
const savedBody = () => useNotesStore.getState().entries[key]?.body;

beforeEach(() => {
  vi.useFakeTimers();
  useNotesStore.setState(EMPTY_NOTES);
});
afterEach(() => vi.useRealTimers());

const type = (value: string) =>
  fireEvent.change(screen.getByLabelText(/your private notes/i), { target: { value } });

describe("NotesSection", () => {
  it("autosaves after a pause in typing", () => {
    render(<NotesSection mediaKey={key} title="Fight Club" />);
    type("Great twist");
    expect(screen.getByText("Saving…")).toBeInTheDocument();
    expect(savedBody()).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS.autosave);
    });

    expect(savedBody()).toBe("Great twist");
    expect(screen.getByText(/^Saved/)).toBeInTheDocument();
  });

  it("saves immediately on blur", () => {
    render(<NotesSection mediaKey={key} title="Fight Club" />);
    type("Blurred");
    fireEvent.blur(screen.getByLabelText(/your private notes/i));
    expect(savedBody()).toBe("Blurred");
  });

  it("flushes unsaved text when leaving the page (unmount)", () => {
    const { unmount } = render(<NotesSection mediaKey={key} title="Fight Club" />);
    type("Typed then navigated away");
    unmount();
    expect(savedBody()).toBe("Typed then navigated away");
  });

  it("loads an existing note and clears it", () => {
    useNotesStore.getState().save(key, "Fight Club", "Existing");
    render(<NotesSection mediaKey={key} title="Fight Club" />);
    expect(screen.getByLabelText(/your private notes/i)).toHaveValue("Existing");

    fireEvent.click(screen.getByRole("button", { name: /clear note/i }));
    expect(savedBody()).toBeUndefined();
    expect(screen.getByLabelText(/your private notes/i)).toHaveValue("");
  });
});
