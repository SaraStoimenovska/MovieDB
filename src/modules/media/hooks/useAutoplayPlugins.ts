"use client";

import Autoplay from "embla-carousel-autoplay";
import { useMemo } from "react";
import { AUTOPLAY_DELAY_MS } from "@/shared/config/timing";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";

/**
 * Embla plugins for an auto-advancing carousel. Pauses on hover and keyboard focus (users can
 * read and click) and is disabled entirely when the OS asks for reduced motion.
 */
export const useAutoplayPlugins = (enabled = true) => {
  const reducedMotion = useReducedMotion();
  return useMemo(
    () =>
      enabled && !reducedMotion
        ? [
            Autoplay({
              delay: AUTOPLAY_DELAY_MS,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
              stopOnFocusIn: true,
            }),
          ]
        : [],
    [enabled, reducedMotion],
  );
};
