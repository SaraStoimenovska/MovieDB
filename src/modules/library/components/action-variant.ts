/** How a library action renders: compact icon (card overlay) or labelled button (details page). */
export const ActionVariant = { Icon: "icon", Full: "full" } as const;
export type ActionVariant = (typeof ActionVariant)[keyof typeof ActionVariant];

/** Round, translucent icon button that stays readable on top of any poster. 36px ≈ touch-friendly. */
export const OVERLAY_ICON_BUTTON =
  "size-9 rounded-full bg-background/85 shadow backdrop-blur hover:bg-background";
