"use client";

import { useEffect, useRef } from "react";

const EDITABLE = "input, textarea, select, [contenteditable='true']";

/** True when the key press happens while the user is typing in a field. */
const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(EDITABLE) !== null;

/**
 * Global single-key shortcut (e.g. "/" to focus search), ignored while typing in a field.
 * The latest `handler` is always used without re-subscribing.
 */
export const useHotkey = (key: string, handler: () => void) => {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      handlerRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key]);
};
